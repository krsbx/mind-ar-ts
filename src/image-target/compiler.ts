import { tensor as tfTensor, tidy as tfTidy, nextFrame as tfNextFrame } from '@tensorflow/tfjs';
import * as msgpack from '@msgpack/msgpack';
import CompilerWorker from './compiler.worker.ts';
import { Detector } from './detector/detector';
import { buildImageList, buildTrackingImageList } from './image-list';
import { build as hierarchicalClusteringBuild } from './matching/hierarchical-clustering';
import {
  ICompilerData,
  IDataList,
  IKeyFrame,
  ImageDataWithScale,
  ITrackingFeature,
} from './utils/types/compiler';
import { WORKER_EVENT } from './utils/constant/compiler';
import { DEFAULT_WORKER, IS_PRODUCTION } from './utils/constant';
import { Helper } from '../libs';

// TODO: better compression method. now grey image saved in pixels, which could be larger than original image

const CURRENT_VERSION = 2;

class Compiler {
  private data: ICompilerData[];

  constructor() {
    this.data = [];
  }

  // input html Images
  compileImageTargets(images: ImageBitmap[], progressCallback: (progress: number) => void) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<ICompilerData[]>(async (resolve) => {
      const targetImages: ImageData[] = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];

        const processCanvas = Helper.castTo<HTMLCanvasElement>(document.createElement('canvas'));
        processCanvas.width = img.width;
        processCanvas.height = img.height;

        const processContext = processCanvas.getContext('2d') as CanvasRenderingContext2D;
        processContext.drawImage(img, 0, 0, img.width, img.height);

        const processData = processContext.getImageData(0, 0, img.width, img.height);
        const greyImageData = new Uint8Array(img.width * img.height);

        for (let i = 0; i < greyImageData.length; i++) {
          const offset = i * 4;

          greyImageData[i] = Math.floor(
            (processData.data[offset] +
              processData.data[offset + 1] +
              processData.data[offset + 2]) /
              3
          );
        }

        const targetImage = Helper.castTo<ImageData>({
          data: greyImageData,
          height: img.height,
          width: img.width,
        });

        targetImages.push(targetImage);
      }

      // compute matching data: 50% progress
      const percentPerImage = 50.0 / targetImages.length;

      let percent = 0.0;
      this.data = [];

      for (let i = 0; i < targetImages.length; i++) {
        const targetImage = targetImages[i];
        const imageList = buildImageList(targetImage);
        const percentPerAction = percentPerImage / imageList.length;

        const matchingData = await _extractMatchingFeatures(imageList, () => {
          percent += percentPerAction;
          progressCallback(percent);
        });

        this.data.push({
          targetImage,
          imageList,
          matchingData,
        } as ICompilerData);
      }

      for (let i = 0; i < targetImages.length; i++) {
        const trackingImageList = buildTrackingImageList(targetImages[i]);
        this.data[i].trackingImageList = trackingImageList;
      }

      // compute tracking data with worker: 50% progress
      const compileTrack = () => {
        return new Promise<ITrackingFeature[][]>((resolve) => {
          const worker = IS_PRODUCTION ? new CompilerWorker() : DEFAULT_WORKER.COMPILER;

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

      for (let i = 0; i < targetImages.length; i++) {
        this.data[i].trackingData = trackingDataList[i];
      }

      resolve(this.data);
    });
  }

  // not exporting imageList because too large. rebuild this using targetImage
  exportData() {
    const dataList: IDataList[] = [];

    for (let i = 0; i < this.data.length; i++) {
      dataList.push({
        targetImage: {
          width: this.data[i].targetImage.width,
          height: this.data[i].targetImage.height,
        },
        trackingData: this.data[i].trackingData,
        matchingData: this.data[i].matchingData,
      });
    }

    const buffer = msgpack.encode({
      v: CURRENT_VERSION,
      dataList,
    });

    return buffer;
  }

  importData(buffer: ArrayBuffer) {
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

    for (let i = 0; i < dataList.length; i++) {
      this.data.push({
        targetImage: dataList[i].targetImage,
        trackingData: dataList[i].trackingData,
        matchingData: dataList[i].matchingData,
      } as ICompilerData);
    }

    return this.data;
  }
}

const _extractMatchingFeatures = async (
  imageList: ImageDataWithScale[],
  doneCallback: (iteration: number) => void
) => {
  const keyframes: IKeyFrame[] = [];

  for (let i = 0; i < imageList.length; i++) {
    const image = imageList[i];
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
};

export { Compiler };
