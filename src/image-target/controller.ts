import { memory as tfMemory, Tensor, nextFrame as tfNextFrame } from '@tensorflow/tfjs';
import Tracker from './tracker/tracker';
import CropDetector from './detector/crop-detector';
import Compiler from './compiler';
import InputLoader from './input-loader';
import { Helper, OneEuroFilter } from '../libs';
import ProdControllerWorker from './controller.worker?worker&inline';
import { ControllerConstructor } from './utils/types/image-target';
import {
  DEFAULT_FILTER_BETA,
  DEFAULT_FILTER_CUTOFF,
  DEFAULT_MISS_TOLERANCE,
  DEFAULT_WARMUP_TOLERANCE,
} from './utils/constant/controller';
import {
  IControllerWorkerResult,
  IOnUpdate,
  ITrackingCoords,
  ITrackingState,
} from './utils/types/controller';
import { ON_UPDATE_EVENT, WORKER_EVENT } from './utils/constant/controller';
import { IKeyFrame, IMaximaMinimaPoint, ITrackingFeature } from './utils/types/compiler';

class Controller {
  private inputWidth: number;
  private inputHeight: number;
  private maxTrack: number;
  private filterMinCF: number;
  private filterBeta: number;
  private warmupTolerance: number;
  private missTolerance: number;
  private cropDetector: CropDetector;
  private inputLoader: InputLoader;
  private markerDimensions: number[][];
  private onUpdate: ((event: IOnUpdate) => void) | null;
  private debugMode: boolean;
  private processingVideo: boolean;
  public interestedTargetIndex: number;
  private projectionTransform: number[][];
  private projectionMatrix: number[];
  private worker: Worker;
  private workerMatchDone: null | ((data: IControllerWorkerResult['MATCH']) => void);
  private workerTrackDone: null | ((data: IControllerWorkerResult['TRACK_UPDATE']) => void);
  private trackingStates: ITrackingState[];
  private tracker!: Tracker;

  constructor({
    inputWidth,
    inputHeight,
    onUpdate = null,
    debugMode = false,
    maxTrack = 1,
    warmupTolerance = null,
    missTolerance = null,
    filterMinCF = null,
    filterBeta = null,
  }: ControllerConstructor) {
    this.inputHeight = inputHeight;
    this.inputWidth = inputWidth;
    this.maxTrack = maxTrack;
    this.filterMinCF = Helper.isNil(filterMinCF) ? DEFAULT_FILTER_CUTOFF : filterMinCF;
    this.filterBeta = Helper.isNil(filterBeta) ? DEFAULT_FILTER_BETA : filterBeta;
    this.warmupTolerance = Helper.isNil(warmupTolerance)
      ? DEFAULT_WARMUP_TOLERANCE
      : warmupTolerance;
    this.missTolerance = Helper.isNil(missTolerance) ? DEFAULT_MISS_TOLERANCE : missTolerance;
    this.cropDetector = new CropDetector(this.inputWidth, this.inputHeight, debugMode);
    this.inputLoader = new InputLoader(this.inputWidth, this.inputHeight);
    this.markerDimensions = [];
    this.onUpdate = onUpdate;
    this.debugMode = debugMode;
    this.processingVideo = false;
    this.interestedTargetIndex = -1;
    this.trackingStates = [];

    const near = 10;
    const far = 100000;
    const fovy = (45.0 * Math.PI) / 180; // 45 in radian. field of view vertical
    const f = this.inputHeight / 2 / Math.tan(fovy / 2);
    //     [fx  s cx]
    // K = [ 0 fx cy]
    //     [ 0  0  1]
    this.projectionTransform = [
      [f, 0, this.inputWidth / 2],
      [0, f, this.inputHeight / 2],
      [0, 0, 1],
    ];

    this.projectionMatrix = this._glProjectionMatrix({
      projectionTransform: this.projectionTransform,
      width: this.inputWidth,
      height: this.inputHeight,
      near,
      far,
    });

    this.worker = new ProdControllerWorker();

    this.workerMatchDone = null;
    this.workerTrackDone = null;

    this.worker.onmessage = (e) => {
      switch (e.data.type) {
        case WORKER_EVENT.MATCH_DONE:
          this.workerMatchDone?.(e.data);
          break;
        case WORKER_EVENT.TRACK_UPDATE_DONE:
          this.workerTrackDone?.(e.data);
          break;
      }
    };
  }

  public showTFStats() {
    console.log(tfMemory().numTensors);
    console.table(tfMemory());
  }

  public addImageTargets(fileURL: string) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<ReturnType<Controller['addImageTargetsFromBuffer']>>(async (resolve) => {
      const content = await fetch(fileURL);
      const buffer = await content.arrayBuffer();
      const result = this.addImageTargetsFromBuffer(buffer);

      resolve(result);
    });
  }

  public addImageTargetsFromBuffer(buffer: ArrayBuffer) {
    const compiler = new Compiler();
    const dataList = compiler.importData(buffer);

    const trackingDataList: ITrackingFeature[][] = [];
    const matchingDataList: IKeyFrame[][] = [];
    const dimensions: number[][] = [];

    for (const data of dataList) {
      matchingDataList.push(data.matchingData);
      trackingDataList.push(data.trackingData);
      dimensions.push([data.targetImage.width, data.targetImage.height]);
    }

    this.tracker = new Tracker(
      dimensions,
      trackingDataList,
      this.projectionTransform,
      this.inputWidth,
      this.inputHeight,
      this.debugMode
    );

    this.worker.postMessage({
      type: WORKER_EVENT.SETUP,
      inputWidth: this.inputWidth,
      inputHeight: this.inputHeight,
      projectionTransform: this.projectionTransform,
      debugMode: this.debugMode,
      matchingDataList,
    });

    this.markerDimensions = dimensions;

    return { dimensions, matchingDataList, trackingDataList };
  }

  // warm up gpu - build kernels is slow
  public dummyRun(input: CanvasImageSource) {
    const inputT = this.inputLoader.loadInput(input);

    this.cropDetector.detect(inputT);
    this.tracker.dummyRun(inputT);

    inputT.dispose();
  }

  public getProjectionMatrix() {
    return this.projectionMatrix;
  }

  public getWorldMatrix(modelViewTransform: number[][], targetIndex: number) {
    return this._glModelViewMatrix(modelViewTransform, targetIndex);
  }

  private async _detectAndMatch(inputT: Tensor, targetIndexes: number[]) {
    const { featurePoints } = this.cropDetector.detectMoving(inputT);

    const { targetIndex: matchedTargetIndex, modelViewTransform } = await this._workerMatch(
      featurePoints,
      targetIndexes
    );

    return { targetIndex: matchedTargetIndex, modelViewTransform };
  }

  private async _trackAndUpdate(
    inputT: Tensor,
    lastModelViewTransform: number[][],
    targetIndex: number
  ) {
    const { worldCoords, screenCoords } = await this.tracker.track(
      inputT,
      lastModelViewTransform,
      targetIndex
    );

    if (worldCoords.length < 4) return null;

    const modelViewTransform = await this._workerTrackUpdate(lastModelViewTransform, {
      worldCoords,
      screenCoords,
    });

    return modelViewTransform;
  }

  // build openGL projection matrix
  // ref: https://strawlab.org/2011/11/05/augmented-reality-with-OpenGL/
  private _glProjectionMatrix(options: {
    projectionTransform: number[][];
    width: number;
    height: number;
    near: number;
    far: number;
  }) {
    const { projectionTransform, width, height, near, far } = options;

    const proj = [
      [
        (2 * projectionTransform[0][0]) / width,
        0,
        -((2 * projectionTransform[0][2]) / width - 1),
        0,
      ],
      [
        0,
        (2 * projectionTransform[1][1]) / height,
        -((2 * projectionTransform[1][2]) / height - 1),
        0,
      ],
      [0, 0, -(far + near) / (far - near), (-2 * far * near) / (far - near)],
      [0, 0, -1, 0],
    ];

    const projMatrix = [];

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        projMatrix.push(proj[j][i]);
      }
    }

    return projMatrix;
  }

  private _glModelViewMatrix(modelViewTransform: number[][], targetIndex: number) {
    const height = this.markerDimensions[targetIndex][1];

    // Question: can someone verify this interpreation is correct?
    // I'm not very convinced, but more like trial and error and works......
    //
    // First, opengl has y coordinate system go from bottom to top, while the marker corrdinate goes from top to bottom,
    //    since the modelViewTransform is estimated in marker coordinate, we need to apply this transform before modelViewTransform
    //    I can see why y = h - y*, but why z = z* ? should we intepret it as rotate 90 deg along x-axis and then translate y by h?
    //
    //    [1  0  0  0]
    //    [0 -1  0  h]
    //    [0  0 -1  0]
    //    [0  0  0  1]
    //
    //    This is tested that if we reverse marker coordinate from bottom to top and estimate the modelViewTransform,
    //    then the above matrix is not necessary.
    //
    // Second, in opengl, positive z is away from camera, so we rotate 90 deg along x-axis after transform to fix the axis mismatch
    //    [1  1  0  0]
    //    [0 -1  0  0]
    //    [0  0 -1  0]
    //    [0  0  0  1]
    //
    // all together, the combined matrix is
    //
    //    [1  1  0  0]   [m00, m01, m02, m03]   [1  0  0  0]
    //    [0 -1  0  0]   [m10, m11, m12, m13]   [0 -1  0  h]
    //    [0  0 -1  0]   [m20, m21, m22, m23]   [0  0 -1  0]
    //    [0  0  0  1]   [  0    0    0    1]   [0  0  0  1]
    //
    //    [ m00,  -m01,  -m02,  (m01 * h + m03) ]
    //    [-m10,   m11,   m12, -(m11 * h + m13) ]
    //  = [-m20,   m21,   m22, -(m21 * h + m23) ]
    //    [   0,     0,     0,                1 ]
    //
    //
    // Finally, in threejs, matrix is represented in col by row, so we transpose it, and get below:
    const openGLWorldMatrix = [
      modelViewTransform[0][0],
      -modelViewTransform[1][0],
      -modelViewTransform[2][0],
      0,
      -modelViewTransform[0][1],
      modelViewTransform[1][1],
      modelViewTransform[2][1],
      0,
      -modelViewTransform[0][2],
      modelViewTransform[1][2],
      modelViewTransform[2][2],
      0,
      modelViewTransform[0][1] * height + modelViewTransform[0][3],
      -(modelViewTransform[1][1] * height + modelViewTransform[1][3]),
      -(modelViewTransform[2][1] * height + modelViewTransform[2][3]),
      1,
    ];

    return openGLWorldMatrix;
  }

  private async _matchImageTarget(nTracking: number, inputT: Tensor) {
    // Stop tracking if we reach the maximum number of targets
    if (nTracking >= this.maxTrack) return;

    const matchingIndexes: number[] = [];

    for (const [i, trackingState] of this.trackingStates.entries()) {
      // Skip if the current target is the one that we track
      if (trackingState.isTracking) continue;

      // Skip if have track a target already
      if (this.interestedTargetIndex !== -1 && this.interestedTargetIndex !== i) continue;

      matchingIndexes.push(i);
    }

    const { targetIndex: matchedTargetIndex, modelViewTransform } = await this._detectAndMatch(
      inputT,
      matchingIndexes
    );

    if (matchedTargetIndex === -1) return;

    this.trackingStates[matchedTargetIndex].isTracking = true;
    this.trackingStates[matchedTargetIndex].currentModelViewTransform = modelViewTransform;
  }

  private async _updateTrackingState(inputT: Tensor, targetIndex: number) {
    const trackingState = this.trackingStates[targetIndex];

    // Skip if the current target is the one that we track
    if (!trackingState.isTracking || !trackingState.currentModelViewTransform) return;

    const modelViewTransform = await this._trackAndUpdate(
      inputT,
      trackingState.currentModelViewTransform,
      targetIndex
    );

    // Disable tracking if the track doesnt have a matrix to track
    if (modelViewTransform === null) {
      trackingState.isTracking = false;
      return;
    }

    trackingState.currentModelViewTransform = modelViewTransform;
  }

  private _showAfterWarmup(targetIndex: number) {
    const trackingState = this.trackingStates[targetIndex];

    // Skip if the current target is the one that we track
    if (trackingState.showing || !trackingState.isTracking) return;

    // If the target is tracking, incease the number of tracking
    trackingState.trackMiss = 0;
    trackingState.trackCount++;

    // If the target tracking count not reaching the tolerance, skip
    if (trackingState.trackCount <= this.warmupTolerance) return;

    trackingState.showing = true;
    trackingState.trackingMatrix = null;
    trackingState.filter.reset();
  }

  private _hideAfterMiss(targetIndex: number) {
    const trackingState = this.trackingStates[targetIndex];

    // Stop process if its not showing
    if (!trackingState.showing) return;

    // Reset the missed count on tracking
    if (trackingState.isTracking) {
      trackingState.trackMiss = 0;
      return;
    }

    // If the target is not tracking, increase the missed count
    trackingState.trackCount = 0;
    trackingState.trackMiss++;

    // If its not reach the miss tolerance, return
    if (trackingState.trackMiss < this.missTolerance) return;

    trackingState.showing = false;
    trackingState.trackingMatrix = null;

    this.onUpdate?.({
      type: ON_UPDATE_EVENT.UPDATE_MATRIX,
      targetIndex,
      worldMatrix: null,
    });
  }

  private _onTrackShow(targetIndex: number) {
    const trackingState = this.trackingStates[targetIndex];

    // If the target is not tracking, return
    if (!trackingState.showing || !trackingState.currentModelViewTransform) return;

    const worldMatrix = this._glModelViewMatrix(
      trackingState.currentModelViewTransform,
      targetIndex
    );

    trackingState.trackingMatrix = trackingState.filter.filter(Date.now(), worldMatrix);

    this.onUpdate?.({
      type: ON_UPDATE_EVENT.UPDATE_MATRIX,
      worldMatrix: Helper.deepClone(trackingState.trackingMatrix),
      targetIndex,
    });
  }

  private async _doVideoProcessing(input: CanvasImageSource) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!this.processingVideo) break;

      const inputT = this.inputLoader.loadInput(input);

      const nTracking = this.trackingStates.reduce((acc, s) => acc + (s.isTracking ? 1 : 0), 0);

      await this._matchImageTarget(nTracking, inputT);

      // Update the tracking state
      for (const [i] of this.trackingStates.entries()) {
        await this._updateTrackingState(inputT, i);

        this._showAfterWarmup(i);

        this._hideAfterMiss(i);

        this._onTrackShow(i);
      }

      inputT.dispose();

      this.onUpdate?.({ type: ON_UPDATE_EVENT.DONE });

      await tfNextFrame();
    }
  }

  public processVideo(input: CanvasImageSource) {
    if (this.processingVideo) return;

    this.processingVideo = true;

    this.trackingStates = [];

    for (let i = 0; i < this.maxTrack; i++)
      this.trackingStates.push({
        showing: false,
        isTracking: false,
        currentModelViewTransform: null,
        trackCount: 0,
        trackMiss: 0,
        filter: new OneEuroFilter({ minCutOff: this.filterMinCF, beta: this.filterBeta }),
      } as ITrackingState);

    this._doVideoProcessing(input);
  }

  public stopProcessVideo() {
    this.processingVideo = false;
  }

  public async detect(input: CanvasImageSource) {
    const inputT = this.inputLoader.loadInput(input);
    const { featurePoints, debugExtra } = await this.cropDetector.detect(inputT);

    inputT.dispose();

    return { featurePoints, debugExtra };
  }

  public async match(featurePoints: IMaximaMinimaPoint[], targetIndex: number) {
    const { modelViewTransform, debugExtra } = await this._workerMatch(featurePoints, [
      targetIndex,
    ]);

    return { modelViewTransform, debugExtra };
  }

  private async _workerMatch(featurePoints: IMaximaMinimaPoint[], targetIndexes: number[]) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<IControllerWorkerResult['MATCH']>(async (resolve) => {
      this.workerMatchDone = (data: IControllerWorkerResult['MATCH']) => {
        resolve({
          targetIndex: data.targetIndex,
          modelViewTransform: data.modelViewTransform,
          debugExtra: data.debugExtra,
        });
      };

      this.worker.postMessage({ type: WORKER_EVENT.MATCH, featurePoints, targetIndexes });
    });
  }

  public async track(
    input: CanvasImageSource,
    modelViewTransform: number[][],
    targetIndex: number
  ) {
    const inputT = this.inputLoader.loadInput(input);
    const result = this.tracker.track(inputT, modelViewTransform, targetIndex);

    inputT.dispose();

    return result;
  }

  public async trackUpdate(modelViewTransform: number[][], trackFeatures: ITrackingCoords) {
    if (trackFeatures.worldCoords.length < 4) return null;

    const modelViewTransform2 = await this._workerTrackUpdate(modelViewTransform, trackFeatures);

    return modelViewTransform2;
  }

  private async _workerTrackUpdate(
    modelViewTransform: number[][],
    trackingFeatures: ITrackingCoords
  ) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<number[][]>(async (resolve) => {
      this.workerTrackDone = (data: IControllerWorkerResult['TRACK_UPDATE']) => {
        resolve(data.modelViewTransform);
      };

      const { worldCoords, screenCoords } = trackingFeatures;

      this.worker.postMessage({
        type: WORKER_EVENT.TRACK_UPDATE,
        modelViewTransform,
        screenCoords,
        worldCoords,
      });
    });
  }
}

export default Controller;
