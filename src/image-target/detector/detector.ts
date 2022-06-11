import {
  Tensor,
  TensorInfo,
  tidy as tfTidy,
  backend as tfBackend,
  engine as tfEngine,
  tensor as tfTensor,
  keep as tfKeep,
  stack as tfStack,
  DataTypeMap,
} from '@tensorflow/tfjs';
import { GPGPUProgram, MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl';
import { DetectorKernel } from '../utils/kernels';
import { IMaximaMinimaPoint } from '../utils/types/compiler';
import { IDebugExtra } from '../utils/types/detector';
import { Helper } from '../../libs';
import {
  EIGHT_BIT_COLOR,
  FREAK_CONPARISON_COUNT,
  MAX_FEATURES_PER_BUCKET,
  NUM_BUCKETS_PER_DIMENSION,
  ONE_OVER_2PI,
  ORIENTATION_GAUSSIAN_EXPANSION_FACTOR,
  ORIENTATION_REGION_EXPANSION_FACTOR,
  ORIENTATION_SMOOTHING_ITERATIONS,
  PYRAMID_MAX_OCTAVE,
  PYRAMID_MIN_SIZE,
} from '../utils/constant/detector';
import FREAKPOINTS from '../utils/constant/freak';

class Detector {
  private debugMode: boolean;
  private width: number;
  private height: number;
  private numOctaves: number;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private tensorCaches: Record<any, any>;
  private kernelCaches: Record<any, any>;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  constructor(width: number, height: number, debugMode = false) {
    this.width = width;
    this.height = height;
    this.debugMode = debugMode;

    let numOctaves = 0;

    while (width >= PYRAMID_MIN_SIZE && height >= PYRAMID_MIN_SIZE) {
      width /= 2;
      height /= 2;
      numOctaves++;

      if (numOctaves === PYRAMID_MAX_OCTAVE) break;
    }

    this.numOctaves = numOctaves;

    this.tensorCaches = {};
    this.kernelCaches = {};
  }

  public detectImageData(imageData: number[]) {
    const arr = new Uint8ClampedArray(4 * imageData.length);

    for (const [i, imgData] of imageData.entries()) {
      arr[4 * i] = imgData;
      arr[4 * i + 1] = imgData;
      arr[4 * i + 2] = imgData;
      arr[4 * i + 3] = 255;
    }

    const img = Helper.castTo<Tensor>(new ImageData(arr, this.width, this.height));
    return this.detect(img);
  }

  // Build gaussian pyramid images, two images per octave
  private _buildPyramidImage(inputImageT: Tensor): Tensor[][] {
    const pyramidImagesT: Tensor[][] = [];

    for (let i = 0; i < this.numOctaves; i++) {
      let image1T: Tensor;

      if (i === 0) image1T = this._applyFilter(inputImageT);
      else
        image1T = this._downsampleBilinear(pyramidImagesT[i - 1][pyramidImagesT[i - 1].length - 1]);

      const image2T = this._applyFilter(image1T);

      pyramidImagesT.push([image1T, image2T]);
    }

    return pyramidImagesT;
  }

  // Build difference-of-gaussian (dog) pyramid
  private _buildDogPyramid(pyramidImagesT: Tensor[][]) {
    const dogPyramidImagesT: Tensor[] = [];

    for (let i = 0; i < this.numOctaves; i++) {
      const dogImageT = this._differenceImageBinomial(pyramidImagesT[i][0], pyramidImagesT[i][1]);

      dogPyramidImagesT.push(dogImageT);
    }

    return dogPyramidImagesT;
  }

  // find local maximum/minimum
  private _getExtremas(dogPyramidImagesT: Tensor[]) {
    const extremasResultsT: Tensor[] = [];

    for (let i = 1; i < this.numOctaves - 1; i++) {
      const extremasResultT = this._buildExtremas(
        dogPyramidImagesT[i - 1],
        dogPyramidImagesT[i],
        dogPyramidImagesT[i + 1]
      );
      extremasResultsT.push(extremasResultT);
    }

    return extremasResultsT;
  }

  // get featured points from the image
  private _getFeaturePoints(
    prunedExtremasArr: number[][],
    freakDescriptorsArr: number[][],
    extremaAnglesArr: number[]
  ) {
    const featurePoints: IMaximaMinimaPoint[] = [];

    for (const [i, prunedExtremas] of prunedExtremasArr.entries()) {
      if (prunedExtremas[0] == 0) continue;

      const descriptors: number[] = [];

      for (let m = 0; m < freakDescriptorsArr[i].length; m += 4) {
        const v1 = freakDescriptorsArr[i][m];
        const v2 = freakDescriptorsArr[i][m + 1];
        const v3 = freakDescriptorsArr[i][m + 2];
        const v4 = freakDescriptorsArr[i][m + 3];

        const combined =
          v1 * EIGHT_BIT_COLOR ** 3 + v2 * EIGHT_BIT_COLOR ** 2 + v3 * EIGHT_BIT_COLOR + v4;

        descriptors.push(combined);
      }

      const octave = prunedExtremas[1];
      const y = prunedExtremas[2];
      const x = prunedExtremas[3];
      const originalX = x * Math.pow(2, octave) + Math.pow(2, octave - 1) - 0.5;
      const originalY = y * Math.pow(2, octave) + Math.pow(2, octave - 1) - 0.5;
      const scale = Math.pow(2, octave);

      featurePoints.push({
        maxima: prunedExtremas[0] > 0,
        x: originalX,
        y: originalY,
        scale,
        angle: extremaAnglesArr[i],
        descriptors,
      });
    }

    return featurePoints;
  }

  public detect(inputImageT: Tensor) {
    let debugExtra: IDebugExtra = {} as IDebugExtra;

    const pyramidImagesT = this._buildPyramidImage(inputImageT);
    const dogPyramidImagesT = this._buildDogPyramid(pyramidImagesT);
    const extremasResultsT = this._getExtremas(dogPyramidImagesT);

    // divide the input into N by N buckets, and for each bucket,
    // collect the top 5 most significant extrema across extremas in all scale level
    // result would be NUM_BUCKETS x NUM_FEATURES_PER_BUCKET extremas
    const prunedExtremasList = this._applyPrune(extremasResultsT);
    const prunedExtremasT = this._computeLocalization(prunedExtremasList, dogPyramidImagesT);

    // compute the orientation angle for each pruned extremas
    const extremaHistogramsT = this._computeOrientationHistograms(prunedExtremasT, pyramidImagesT);
    const smoothedHistogramsT = this._smoothHistograms(extremaHistogramsT);
    const extremaAnglesT = this._computeExtremaAngles(smoothedHistogramsT);

    // to compute freak descriptors, we first find the pixel value of 37 freak points for each extrema
    const extremaFreaksT = this._computeExtremaFreak(
      pyramidImagesT,
      prunedExtremasT,
      extremaAnglesT
    );

    // compute the binary descriptors
    const freakDescriptorsT = this._computeFreakDescriptors(extremaFreaksT);

    const prunedExtremasArr = prunedExtremasT.arraySync() as number[][];
    const extremaAnglesArr = extremaAnglesT.arraySync() as number[];
    const freakDescriptorsArr = freakDescriptorsT.arraySync() as number[][];

    if (this.debugMode) {
      debugExtra = {
        pyramidImages: pyramidImagesT.map((ts) => ts.map((t) => t.arraySync())) as number[][],
        dogPyramidImages: dogPyramidImagesT.map((t) => (t?.arraySync() as number[]) ?? null),
        extremasResults: extremasResultsT.map((t) => t.arraySync()) as number[],
        extremaAngles: extremaAnglesT.arraySync() as number[],
        prunedExtremas: prunedExtremasList,
        localizedExtremas: prunedExtremasT.arraySync() as number[][],
      } as IDebugExtra;
    }

    // Cleanup tensors
    pyramidImagesT.forEach((ts) => ts.forEach((t) => t?.dispose()));
    dogPyramidImagesT.forEach((t) => t?.dispose());
    extremasResultsT.forEach((t) => t.dispose());
    prunedExtremasT.dispose();
    extremaHistogramsT.dispose();
    smoothedHistogramsT.dispose();
    extremaAnglesT.dispose();
    extremaFreaksT.dispose();
    freakDescriptorsT.dispose();

    const featurePoints: IMaximaMinimaPoint[] = this._getFeaturePoints(
      prunedExtremasArr,
      freakDescriptorsArr,
      extremaAnglesArr
    );

    return {
      featurePoints,
      debugExtra,
    };
  }

  private _compileAndRun(program: GPGPUProgram, inputs: TensorInfo[]) {
    // Reuse the backend and engine
    // By doing this we doesnt need to create a new backend and engine for each detection
    const outInfo = (tfBackend() as MathBackendWebGL).compileAndRun(program, inputs);

    return tfEngine().makeTensorFromTensorInfo(outInfo);
  }

  private _applyPrune(extremasResultsT: Tensor[]) {
    const nBuckets = NUM_BUCKETS_PER_DIMENSION ** 2;
    const nFeatures = MAX_FEATURES_PER_BUCKET;

    if (!this.kernelCaches.applyPrune) {
      // to reduce to amount of data that need to sync back to CPU by 4 times, we apply this trick:
      // the fact that there is not possible to have consecutive maximum/minimum, we can safe combine 4 pixels into 1
      const reductionKernels: GPGPUProgram[] = extremasResultsT.map((extremasResultT) =>
        DetectorKernel.applyPrune(
          extremasResultT.shape[0] as number,
          extremasResultT.shape[1] as number
        )
      );

      this.kernelCaches.applyPrune = { reductionKernels };
    }

    // combine results into a tensor of:
    //   nBuckets x nFeatures x [score, octave, y, x]
    const curAbsScores: number[][] = [];
    const result: number[][][] = [];

    for (let i = 0; i < nBuckets; i++) {
      result.push([]);
      curAbsScores.push([]);

      for (let j = 0; j < nFeatures; j++) {
        result[i].push([0, 0, 0, 0]);

        curAbsScores[i].push(0);
      }
    }

    tfTidy(() => {
      const { reductionKernels } = this.kernelCaches.applyPrune;

      for (let k = 0; k < extremasResultsT.length; k++) {
        const program = reductionKernels[k];
        const reducedT = this._compileAndRun(program, [extremasResultsT[k]]);

        const octave = k + 1; // extrema starts from second octave

        const reduced = reducedT.arraySync() as number[][];
        const height = reducedT.shape[0] as number;
        const width = reducedT.shape[1] as number;

        const bucketWidth = (width * 2) / NUM_BUCKETS_PER_DIMENSION;
        const bucketHeight = (height * 2) / NUM_BUCKETS_PER_DIMENSION;

        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            const encoded = reduced[i][j];

            if (encoded === 0) continue;

            const score = encoded % 1000;
            const loc = Math.floor(Math.abs(encoded) / 1000);
            const x = j * 2 + (loc === 2 || loc === 3 ? 1 : 0);
            const y = i * 2 + (loc === 1 || loc === 3 ? 1 : 0);

            const bucketX = Math.floor(x / bucketWidth);
            const bucketY = Math.floor(y / bucketHeight);

            const bucket = bucketY * NUM_BUCKETS_PER_DIMENSION + bucketX;
            const absScore = Math.abs(score);

            let tIndex = nFeatures;

            while (tIndex >= 1 && absScore >= curAbsScores[bucket][tIndex - 1]) tIndex--;

            if (tIndex >= nFeatures) continue;

            for (let t = nFeatures - 1; t >= tIndex + 1; t--) {
              curAbsScores[bucket][t] = curAbsScores[bucket][t - 1];
              result[bucket][t] = Helper.deepClone(result[bucket][t - 1]);
            }

            curAbsScores[bucket][tIndex] = absScore;
            result[bucket][tIndex][0] = score;
            result[bucket][tIndex][1] = octave;
            result[bucket][tIndex][2] = y;
            result[bucket][tIndex][3] = x;
          }
        }
      }
    });

    // combine all buckets into a single list
    const list: number[][] = [];

    for (let i = 0; i < nBuckets; i++) {
      for (let j = 0; j < nFeatures; j++) {
        list.push(result[i][j]);
      }
    }

    return list;
  }

  private _applyFilter(image: Tensor) {
    const imageHeight = image.shape[0] as number;
    const imageWidth = image.shape[1] as number;

    const kernelKey = 'w' + imageWidth;

    if (!this.kernelCaches.applyFilter) this.kernelCaches.applyFilter = {};

    if (!this.kernelCaches.applyFilter[kernelKey]) {
      this.kernelCaches.applyFilter[kernelKey] = DetectorKernel.applyFilter(
        imageHeight,
        imageWidth
      );
    }

    return tfTidy(() => {
      const [program1, program2] = this.kernelCaches.applyFilter[kernelKey];

      const result1 = this._compileAndRun(program1, [image]);
      const result2 = this._compileAndRun(program2, [result1]);

      return result2;
    });
  }

  private _buildExtremas(image0: Tensor, image1: Tensor, image2: Tensor) {
    const imageHeight = image1.shape[0] as number;
    const imageWidth = image1.shape[1] as number;

    const kernelKey = 'w' + imageWidth;

    if (!this.kernelCaches.buildExtremas) this.kernelCaches.buildExtremas = {};

    if (!this.kernelCaches.buildExtremas[kernelKey]) {
      this.kernelCaches.buildExtremas[kernelKey] = DetectorKernel.buildExtremas(
        imageHeight,
        imageWidth
      );
    }

    return tfTidy(() => {
      const program = this.kernelCaches.buildExtremas[kernelKey];
      image0 = this._downsampleBilinear(image0);
      image2 = this._upsampleBilinear(image2, image1);

      return this._compileAndRun(program, [image0, image1, image2]);
    });
  }

  private _computeLocalization(prunedExtremasList: number[][], dogPyramidImagesT: Tensor[]) {
    if (!this.kernelCaches.computeLocalization) {
      this.kernelCaches.computeLocalization = DetectorKernel.computeLocalization(
        dogPyramidImagesT,
        prunedExtremasList
      );
    }

    return tfTidy(() => {
      const program = this.kernelCaches.computeLocalization[0];

      const prunedExtremasT = tfTensor(
        prunedExtremasList,
        [prunedExtremasList.length, prunedExtremasList[0].length],
        'int32'
      );

      const pixelsT = this._compileAndRun(program, [
        ...dogPyramidImagesT.slice(1),
        prunedExtremasT,
      ]);

      const pixels = pixelsT.arraySync() as number[][][];

      const result: number[][][] = [];

      for (let i = 0; i < pixels.length; i++) {
        result.push([]);

        for (let j = 0; j < pixels[i].length; j++) {
          result[i].push([]);
        }
      }

      const localizedExtremas: number[][] = [];

      for (const prunedExtremas of prunedExtremasList) {
        localizedExtremas.push([
          prunedExtremas[0],
          prunedExtremas[1],
          prunedExtremas[2],
          prunedExtremas[3],
        ]);
      }

      for (const [i, localizedExtrema] of localizedExtremas.entries()) {
        if (localizedExtrema[0] === 0) continue;

        const pixel = pixels[i];
        const dx = 0.5 * (pixel[1][2] - pixel[1][0]);
        const dy = 0.5 * (pixel[2][1] - pixel[0][1]);
        const dxx = pixel[1][2] + pixel[1][0] - 2 * pixel[1][1];
        const dyy = pixel[2][1] + pixel[0][1] - 2 * pixel[1][1];
        const dxy = 0.25 * (pixel[0][0] + pixel[2][2] - pixel[0][2] - pixel[2][0]);

        const det = dxx * dyy - dxy ** 2;
        const ux = (dyy * -dx + -dxy * -dy) / det;
        const uy = (-dxy * -dx + dxx * -dy) / det;

        const newY = localizedExtrema[2] + uy;
        const newX = localizedExtrema[3] + ux;

        if (Math.abs(det) < 0.0001) continue;

        localizedExtrema[2] = newY;
        localizedExtrema[3] = newX;
      }

      return tfTensor(
        localizedExtremas,
        [localizedExtremas.length, localizedExtremas[0].length],
        'float32'
      );
    });
  }

  // TODO: maybe can try just using average momentum, instead of histogram method. histogram might be overcomplicated
  private _computeOrientationHistograms(prunedExtremasT: Tensor, pyramidImagesT: Tensor[][]) {
    const gaussianImagesT: Tensor[] = [];

    for (let i = 1; i < pyramidImagesT.length; i++) {
      gaussianImagesT.push(pyramidImagesT[i][1]);
    }

    if (!this.tensorCaches.orientationHistograms) {
      tfTidy(() => {
        const gwScale = -1.0 / (2 * ORIENTATION_GAUSSIAN_EXPANSION_FACTOR ** 2);
        const radius = ORIENTATION_GAUSSIAN_EXPANSION_FACTOR * ORIENTATION_REGION_EXPANSION_FACTOR;
        const radiusCeil = Math.ceil(radius);

        const radialProperties: number[][] = [];

        for (let y = -radiusCeil; y <= radiusCeil; y++) {
          for (let x = -radiusCeil; x <= radiusCeil; x++) {
            const distance = Math.sqrt(x ** 2 + y ** 2);

            if (distance > radius) continue;

            const w = Math.exp(gwScale * distance ** 2);

            radialProperties.push([x, y, w]);
          }
        }

        this.tensorCaches.orientationHistograms = {
          radialPropertiesT: tfKeep(tfTensor(radialProperties, [radialProperties.length, 3])),
        };
      });
    }

    const { radialPropertiesT } = this.tensorCaches.orientationHistograms;

    if (!this.kernelCaches.computeOrientationHistograms)
      this.kernelCaches.computeOrientationHistograms = DetectorKernel.computeOrientationHistograms(
        pyramidImagesT,
        prunedExtremasT,
        radialPropertiesT,
        ONE_OVER_2PI
      );

    return tfTidy(() => {
      const [program1, program2] = this.kernelCaches.computeOrientationHistograms;

      const result1 = this._compileAndRun(program1, [
        ...gaussianImagesT,
        prunedExtremasT,
        radialPropertiesT,
      ]);
      const result2 = this._compileAndRun(program2, [result1]);

      return result2;
    });
  }

  private _computeExtremaAngles(histograms: Tensor) {
    if (!this.kernelCaches.computeExtremaAngles)
      this.kernelCaches.computeExtremaAngles = DetectorKernel.computeExtremaAngles(histograms);

    return tfTidy(() => {
      const program = this.kernelCaches.computeExtremaAngles;
      return this._compileAndRun(program, [histograms]);
    });
  }

  private _computeExtremaFreak(
    pyramidImagesT: Tensor[][],
    prunedExtremas: Tensor,
    prunedExtremasAngles: Tensor
  ) {
    if (!this.tensorCaches._computeExtremaFreak)
      tfTidy(() => {
        const freakPoints = tfTensor(FREAKPOINTS);
        this.tensorCaches._computeExtremaFreak = {
          freakPointsT: tfKeep(freakPoints),
        };
      });

    const { freakPointsT } = this.tensorCaches._computeExtremaFreak;

    const gaussianImagesT: Tensor[] = [];

    for (let i = 1; i < pyramidImagesT.length; i++) {
      gaussianImagesT.push(pyramidImagesT[i][1]); // better
    }

    if (!this.kernelCaches._computeExtremaFreak)
      this.kernelCaches._computeExtremaFreak = DetectorKernel.computeExtremaFreak(
        pyramidImagesT,
        prunedExtremas
      );

    return tfTidy(() => {
      const [program] = this.kernelCaches._computeExtremaFreak;
      const result = this._compileAndRun(program, [
        ...gaussianImagesT,
        prunedExtremas,
        prunedExtremasAngles,
        freakPointsT,
      ]);

      return result;
    });
  }

  private _computeFreakDescriptors(extremaFreaks: Tensor) {
    if (!this.tensorCaches.computeFreakDescriptors) {
      const in1Arr: number[] = [];
      const in2Arr: number[] = [];

      for (let k1 = 0; k1 < (extremaFreaks.shape[1] as number); k1++) {
        for (let k2 = k1 + 1; k2 < (extremaFreaks.shape[1] as number); k2++) {
          in1Arr.push(k1);
          in2Arr.push(k2);
        }
      }

      const in1 = tfTensor(in1Arr, [in1Arr.length]).cast('int32');
      const in2 = tfTensor(in2Arr, [in2Arr.length]).cast('int32');

      this.tensorCaches.computeFreakDescriptors = {
        positionT: tfKeep(tfStack([in1, in2], 1)),
      };
    }

    const { positionT } = this.tensorCaches.computeFreakDescriptors;

    // encode 8 bits into one number
    // trying to encode 16 bits give wrong result in iOS. may integer precision issue
    const descriptorCount = Math.ceil(FREAK_CONPARISON_COUNT / 8);

    if (!this.kernelCaches.computeFreakDescriptors)
      this.kernelCaches.computeFreakDescriptors = DetectorKernel.computeFreakDescriptors(
        extremaFreaks,
        descriptorCount,
        FREAK_CONPARISON_COUNT
      );

    return tfTidy(() => {
      const [program] = this.kernelCaches.computeFreakDescriptors;
      return this._runWebGLProgram(program, [extremaFreaks, positionT], 'int32');
    });
  }

  private _differenceImageBinomial(image1: Tensor, image2: Tensor) {
    return tfTidy(() => {
      return image1.sub(image2);
    });
  }

  private _upsampleBilinear(image: Tensor, targetImage: Tensor) {
    const imageWidth = image.shape[1] as number;

    const kernelKey = 'w' + imageWidth;

    if (!this.kernelCaches.upsampleBilinear) this.kernelCaches.upsampleBilinear = {};

    if (!this.kernelCaches.upsampleBilinear[kernelKey]) {
      this.kernelCaches.upsampleBilinear[kernelKey] = DetectorKernel.upsampleBilinear(
        targetImage.shape[0] as number,
        targetImage.shape[1] as number
      );
    }

    return tfTidy(() => {
      const program = this.kernelCaches.upsampleBilinear[kernelKey];

      return this._compileAndRun(program, [image]);
    });
  }

  private _downsampleBilinear(image: Tensor) {
    const imageHeight = image.shape[0] as number;
    const imageWidth = image.shape[1] as number;

    const kernelKey = 'w' + imageWidth;

    if (!this.kernelCaches.downsampleBilinear) this.kernelCaches.downsampleBilinear = {};

    if (!this.kernelCaches.downsampleBilinear[kernelKey]) {
      this.kernelCaches.downsampleBilinear[kernelKey] = DetectorKernel.downsampleBilinear(
        imageHeight,
        imageWidth
      );
    }

    return tfTidy(() => {
      const program = this.kernelCaches.downsampleBilinear[kernelKey];

      return this._compileAndRun(program, [image]);
    });
  }

  private _smoothHistograms(histograms: Tensor) {
    if (!this.kernelCaches.smoothHistograms) {
      this.kernelCaches.smoothHistograms = DetectorKernel.smoothHistograms(histograms);
    }

    return tfTidy(() => {
      const program = this.kernelCaches.smoothHistograms;

      for (let i = 0; i < ORIENTATION_SMOOTHING_ITERATIONS; i++)
        histograms = this._compileAndRun(program, [histograms]);

      return histograms;
    });
  }

  private _runWebGLProgram(
    program: GPGPUProgram,
    inputs: TensorInfo[],
    outputType: keyof DataTypeMap
  ) {
    // Reuse the backend and engine
    // By doing this we doesnt need to create a new backend and engine for each detection
    const outInfo = (tfBackend() as MathBackendWebGL).runWebGLProgram(program, inputs, outputType);

    return tfEngine().makeTensorFromTensorInfo(outInfo);
  }
}

export default Detector;
