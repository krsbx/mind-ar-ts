import { tensor as tfTensor, tidy as tfTidy, nextFrame as tfNextFrame } from '@tensorflow/tfjs';
import * as msgpack from '@msgpack/msgpack';
import ProdCompilerWorker from './compiler.worker?worker&inline';
import { buildImageList, buildTrackingImageList } from './image-list';
import hierarchicalClusteringBuild from './matching/hierarchical-clustering';
import {
  ICompilerData,
  IDataList,
  IKeyFrame,
  ImageDataWithScale,
  ITrackingFeature,
} from './utils/types/compiler';
import { Helper } from '../libs';
import { WORKER_EVENT } from './utils/constant/compiler';
import Detector from './detector/detector';

// TODO: better compression method. now grey image saved in pixels, which could be larger than original image

const CURRENT_VERSION = 2;

class Compiler {
  private data: ICompilerData[];

  constructor() {
    this.data = [];
  }

  // input html Images
  public compileImageTargets(
    images: (HTMLImageElement | ImageBitmap)[],
    progressCallback: (progress: number) => void
  ) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<ICompilerData[]>(async (resolve) => {
      const targetImages: ImageData[] = [];

      for (const image of images) {
        const processCanvas = Helper.castTo<HTMLCanvasElement>(document.createElement('canvas'));
        processCanvas.width = image.width;
        processCanvas.height = image.height;

        const processContext = processCanvas.getContext('2d') as CanvasRenderingContext2D;
        processContext.drawImage(image, 0, 0, image.width, image.height);

        const processData = processContext.getImageData(0, 0, image.width, image.height);
        const greyImageData = new Uint8Array(image.width * image.height);

        for (let i = 0; i < greyImageData.length; i++) {
          const offset = i * 4;

          greyImageData[i] = Math.floor(
            (processData.data[offset] +
              processData.data[offset + 1] +
              processData.data[offset + 2]) /
              3
          );
        }

        targetImages.push(
          Helper.castTo<ImageData>({
            data: greyImageData,
            width: image.width,
            height: image.height,
          })
        );
      }

      // compute matching data: 50% progress
      const percentPerImage = 50.0 / targetImages.length;

      let percent = 0.0;

      this.data = [];

      for (let i = 0; i < targetImages.length; i++) {
        const targetImage = targetImages[i];
        const imageList = buildImageList(targetImage);
        const percentPerAction = percentPerImage / imageList.length;

        const matchingData = await this._extractMatchingFeatures(imageList, () => {
          percent += percentPerAction;
          progressCallback(percent);
        });

        const compiledData = {
          targetImage: targetImage,
          imageList: imageList,
          matchingData: matchingData,
        } as ICompilerData;

        this.data.push(compiledData);
      }

      for (const [i, targetImage] of targetImages.entries()) {
        const trackingImageList = buildTrackingImageList(targetImage);

        this.data[i].trackingImageList = trackingImageList;
      }

      // compute tracking data with worker: 50% progress
      const compileTrack = () => {
        return new Promise<ITrackingFeature[][]>((resolve) => {
          const worker = new ProdCompilerWorker();
          worker.onmessage = (e) => {
            switch (e.data.type) {
              case WORKER_EVENT.PROGRESS:
                progressCallback(50 + e.data.percent);
                break;

              case WORKER_EVENT.COMPILE_DONE:
                resolve(e.data.list);
                break;
            }
          };

          worker.postMessage({ type: WORKER_EVENT.COMPILE, targetImages });
        });
      };

      const trackingDataList = await compileTrack();

      for (const [i, trackingData] of trackingDataList.entries()) {
        this.data[i].trackingData = trackingData;
      }

      resolve(this.data);
    });
  }

  // not exporting imageList because too large. rebuild this using targetImage
  public exportData() {
    const dataList: IDataList[] = [];

    for (const data of this.data) {
      dataList.push({
        targetImage: {
          width: data.targetImage.width,
          height: data.targetImage.height,
        },
        trackingData: data.trackingData,
        matchingData: data.matchingData,
      });
    }

    const buffer = msgpack.encode({
      v: CURRENT_VERSION,
      dataList,
    });

    return buffer;
  }

  public importData(buffer: ArrayBuffer) {
    const content = msgpack.decode(new Uint8Array(buffer)) as {
      v: number;
      dataList: IDataList[];
    };

    if (!content.v || content.v !== CURRENT_VERSION) {
      console.error('Your compiled .mind might be outdated. Please recompile');
      return [];
    }

    const { dataList } = content;

    this.data = [];

    for (const data of dataList) {
      this.data.push({
        targetImage: data.targetImage,
        trackingData: data.trackingData,
        matchingData: data.matchingData,
      } as ICompilerData);
    }

    return this.data;
  }

  private async _extractMatchingFeatures(
    imageList: ImageDataWithScale[],
    doneCallback: (iteration: number) => void
  ) {
    const keyframes: IKeyFrame[] = [];

    for (const [i, image] of imageList.entries()) {
      // TODO: can improve performance greatly if reuse the same detector. just need to handle resizing the kernel outputs
      const detector = new Detector(image.width, image.height);

      await tfNextFrame();

      tfTidy(() => {
        const inputT = tfTensor(image.data, [image.data.length], 'float32').reshape([
          image.height,
          image.width,
        ]);

        const { featurePoints: ps } = detector.detect(inputT);

        const maximaPoints = ps.filter((p) => p.maxima);
        const minimaPoints = ps.filter((p) => !p.maxima);
        const maximaPointsCluster = hierarchicalClusteringBuild({ points: maximaPoints });
        const minimaPointsCluster = hierarchicalClusteringBuild({ points: minimaPoints });

        keyframes.push({
          maximaPoints,
          minimaPoints,
          maximaPointsCluster,
          minimaPointsCluster,
          width: image.width,
          height: image.height,
          scale: image.scale,
        });

        doneCallback(i);
      });
    }

    return keyframes;
  }
}

export default Compiler;
