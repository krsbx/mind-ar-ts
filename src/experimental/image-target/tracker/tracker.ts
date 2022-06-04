import {
  Tensor,
  tensor as tfTensor,
  TensorInfo,
  tidy as tfTidy,
  backend as tfBackend,
  engine as tfEngine,
} from '@tensorflow/tfjs';
import { GPGPUProgram, MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl';
import {
  buildModelViewProjectionTransform,
  computeScreenCoordiate,
} from '../../../image-target/estimation/utils';
import { TrackerKernel } from '../../../image-target/utils/kernels';
import { ITrackingFeature } from '../../../image-target/utils/types/compiler';
import { IDebugExtra } from '../../../image-target/utils/types/detector';
import {
  AR2_DEFAULT_TS,
  AR2_DEFAULT_TS_GAP,
  AR2_SEARCH_GAP,
  AR2_SEARCH_SIZE,
  AR2_SIM_THRESH,
  PRECISION_ADJUST,
  TRACKING_KEYFRAME,
} from '../utils/constant/tracker';

class Tracker {
  private projectionTransform: number[][];
  private trackingKeyframeList: ITrackingFeature[];
  private debugMode: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private kernelCaches: Record<any, any>;
  private featurePointsListT: Tensor[];
  private imagePixelsListT: Tensor[];
  private imagePropertiesListT: Tensor[];

  // Tensorflow related
  private engine: ReturnType<typeof tfEngine>;
  private backend: MathBackendWebGL;

  constructor(
    _markerDimensions: number[][],
    trackingDataList: ITrackingFeature[][],
    projectionTransform: number[][],
    _inputWidth: number,
    _inputHeight: number,
    debugMode = false
  ) {
    this.projectionTransform = projectionTransform;
    this.debugMode = debugMode;

    this.trackingKeyframeList = Array.from(
      { length: trackingDataList.length },
      (_, i) => trackingDataList[i][TRACKING_KEYFRAME]
    );

    // prebuild feature and marker pixel tensors
    const maxCount = Math.max(...this.trackingKeyframeList.map(({ points }) => points.length));

    this.featurePointsListT = [];
    this.imagePixelsListT = [];
    this.imagePropertiesListT = [];

    for (let i = 0; i < this.trackingKeyframeList.length; i++) {
      const { featurePoints, imagePixels, imageProperties } = this._prebuild(
        this.trackingKeyframeList[i],
        maxCount
      );

      this.featurePointsListT[i] = featurePoints;
      this.imagePixelsListT[i] = imagePixels;
      this.imagePropertiesListT[i] = imageProperties;
    }

    this.kernelCaches = {};

    // Create the instance for the tensorflow backend and engine
    this.backend = tfBackend() as MathBackendWebGL;
    this.engine = tfEngine();
  }

  public dummyRun(inputT: Tensor) {
    const transform = [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ];

    for (let targetIndex = 0; targetIndex < this.featurePointsListT.length; targetIndex++) {
      this.track(inputT, transform, targetIndex);
    }
  }

  public track(inputImageT: Tensor, lastModelViewTransform: number[][], targetIndex: number) {
    let debugExtra: IDebugExtra = {} as IDebugExtra;

    const modelViewProjectionTransform = buildModelViewProjectionTransform(
      this.projectionTransform,
      lastModelViewTransform
    );

    const modelViewProjectionTransformT = this._buildAdjustedModelViewTransform(
      modelViewProjectionTransform
    );

    const featurePointsT = this.featurePointsListT[targetIndex];
    const imagePixelsT = this.imagePixelsListT[targetIndex];
    const imagePropertiesT = this.imagePropertiesListT[targetIndex];

    const projectedImageT = this._computeProjection(
      modelViewProjectionTransformT,
      inputImageT,
      targetIndex
    );

    const { matchingPointsT, simT } = this._computeMatching(
      featurePointsT,
      imagePixelsT,
      imagePropertiesT,
      projectedImageT
    );

    const matchingPoints = matchingPointsT.arraySync() as number[][];
    const sim = simT.arraySync() as number[];

    const trackingFrame = this.trackingKeyframeList[targetIndex];
    const worldCoords = [];
    const screenCoords = [];
    const goodTrack = [];

    for (let i = 0; i < matchingPoints.length; i++) {
      if (sim[i] > AR2_SIM_THRESH && i < trackingFrame.points.length) {
        goodTrack.push(i);

        const point = computeScreenCoordiate(
          modelViewProjectionTransform,
          matchingPoints[i][0],
          matchingPoints[i][1]
        );

        screenCoords.push(point);

        worldCoords.push({
          x: trackingFrame.points[i].x / trackingFrame.scale,
          y: trackingFrame.points[i].y / trackingFrame.scale,
          z: 0,
        });
      }
    }

    if (this.debugMode) {
      debugExtra = {
        projectedImage: projectedImageT.arraySync() as number[][],
        matchingPoints,
        trackedPoints: screenCoords,
        goodTrack,
      } as IDebugExtra;
    }

    // tensors cleanup
    modelViewProjectionTransformT.dispose();
    projectedImageT.dispose();
    matchingPointsT.dispose();
    simT.dispose();

    return { worldCoords, screenCoords, debugExtra };
  }

  private _prebuild(trackingFrame: ITrackingFeature, maxCount: number) {
    return tfTidy(() => {
      const scale = trackingFrame.scale;

      const p: number[][] = [];

      for (let k = 0; k < maxCount; k++) {
        if (k < trackingFrame.points.length) {
          p.push([trackingFrame.points[k].x / scale, trackingFrame.points[k].y / scale]);
        } else {
          p.push([-1, -1]);
        }
      }

      const imagePixels = tfTensor(trackingFrame.data, [
        trackingFrame.width * trackingFrame.height,
      ]);

      const imageProperties = tfTensor(
        [trackingFrame.width, trackingFrame.height, trackingFrame.scale],
        [3]
      );

      const featurePoints = tfTensor(p, [p.length, 2], 'float32');

      return {
        featurePoints,
        imagePixels,
        imageProperties,
      };
    });
  }

  private _computeMatching(
    featurePointsT: Tensor,
    imagePixelsT: Tensor,
    imagePropertiesT: Tensor,
    projectedImageT: Tensor
  ) {
    const templateOneSize = AR2_DEFAULT_TS;
    const templateSize = templateOneSize * 2 + 1;
    const templateGap = AR2_DEFAULT_TS_GAP;
    const searchOneSize = AR2_SEARCH_SIZE * templateGap;
    const searchGap = AR2_SEARCH_GAP;
    const searchSize = searchOneSize * 2 + 1;

    const targetHeight = projectedImageT.shape[0] as number;
    const targetWidth = projectedImageT.shape[1] as number;
    const featureCount = featurePointsT.shape[0] as number;

    if (!this.kernelCaches.computeMatching)
      this.kernelCaches.computeMatching = TrackerKernel.computeMatching(
        templateOneSize,
        templateSize,
        searchOneSize,
        searchGap,
        searchSize,
        targetHeight,
        targetWidth,
        featureCount
      );

    return tfTidy(() => {
      const programs = this.kernelCaches.computeMatching;

      const allSims = this._compileAndRun(programs[0], [
        featurePointsT,
        imagePixelsT,
        imagePropertiesT,
        projectedImageT,
      ]);
      const maxIndex = allSims.argMax(1);

      const matchingPointsT = this._compileAndRun(programs[1], [
        featurePointsT,
        imagePropertiesT,
        maxIndex,
      ]);

      const simT = this._compileAndRun(programs[2], [allSims, maxIndex]);

      return { matchingPointsT, simT };
    });
  }

  private _computeProjection(
    modelViewProjectionTransformT: Tensor,
    inputImageT: Tensor,
    targetIndex: number
  ) {
    const markerWidth = this.trackingKeyframeList[targetIndex].width;
    const markerHeight = this.trackingKeyframeList[targetIndex].height;
    const markerScale = this.trackingKeyframeList[targetIndex].scale;
    const kernelKey = markerWidth + '-' + markerHeight + '-' + markerScale;

    if (!this.kernelCaches.computeProjection) this.kernelCaches.computeProjection = {};

    if (!this.kernelCaches.computeProjection[kernelKey]) {
      this.kernelCaches.computeProjection[kernelKey] = TrackerKernel.computeProjection(
        markerHeight,
        markerWidth,
        markerScale
      );
    }

    return tfTidy(() => {
      const program = this.kernelCaches.computeProjection[kernelKey];
      const result = this._compileAndRun(program, [modelViewProjectionTransformT, inputImageT]);

      return result;
    });
  }

  private _buildAdjustedModelViewTransform(modelViewProjectionTransform: number[][]) {
    return tfTidy(() => {
      const modelViewProjectionTransformAdjusted: number[][] = [];

      for (let i = 0; i < modelViewProjectionTransform.length; i++) {
        const rows = Array.from(modelViewProjectionTransform[i], (v) => v / PRECISION_ADJUST);

        modelViewProjectionTransformAdjusted.push(rows);
      }

      const t = tfTensor(modelViewProjectionTransformAdjusted, [3, 4]);

      return t;
    });
  }

  private _compileAndRun(program: GPGPUProgram, inputs: TensorInfo[]) {
    const outInfo = this.backend.compileAndRun(program, inputs);

    return this.engine.makeTensorFromTensorInfo(outInfo);
  }
}

export default Tracker;
