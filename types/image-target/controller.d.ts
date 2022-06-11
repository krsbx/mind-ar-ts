import { ControllerConstructor } from './utils/types/image-target';
import { ITrackingCoords } from './utils/types/controller';
import {
  IKeyFrame,
  IMaximaMinimaPoint,
  ITrackingFeature,
} from '../../image-target/utils/types/compiler';

declare class Controller {
  private inputWidth;
  private inputHeight;
  private maxTrack;
  private filterMinCF;
  private filterBeta;
  private warmupTolerance;
  private missTolerance;
  private cropDetector;
  private inputLoader;
  private markerDimensions;
  private onUpdate;
  private debugMode;
  private processingVideo;
  interestedTargetIndex: number;
  private projectionTransform;
  private projectionMatrix;
  private worker;
  private workerMatchDone;
  private workerTrackDone;
  private trackingStates;
  private tracker;
  constructor({
    inputWidth,
    inputHeight,
    onUpdate,
    debugMode,
    maxTrack,
    warmupTolerance,
    missTolerance,
    filterMinCF,
    filterBeta,
  }: ControllerConstructor);
  showTFStats(): void;
  addImageTargets(fileURL: string): Promise<{
    dimensions: number[][];
    matchingDataList: IKeyFrame[][];
    trackingDataList: ITrackingFeature[][];
  }>;
  addImageTargetsFromBuffer(buffer: ArrayBuffer): {
    dimensions: number[][];
    matchingDataList: IKeyFrame[][];
    trackingDataList: ITrackingFeature[][];
  };
  dummyRun(input: CanvasImageSource): void;
  getProjectionMatrix(): number[];
  getWorldMatrix(modelViewTransform: number[][], targetIndex: number): number[];
  private _detectAndMatch;
  private _trackAndUpdate;
  private _glProjectionMatrix;
  private _glModelViewMatrix;
  private _matchImageTarget;
  private _updateTrackingState;
  private _showAfterWarmup;
  private _hideAfterMiss;
  private _onTrackShow;
  private _doVideoProcessing;
  processVideo(input: CanvasImageSource): void;
  stopProcessVideo(): void;
  detect(input: CanvasImageSource): Promise<{
    featurePoints: IMaximaMinimaPoint[];
    debugExtra: import('./utils/types/detector').IDebugExtra;
  }>;
  match(
    featurePoints: IMaximaMinimaPoint[],
    targetIndex: number
  ): Promise<{
    modelViewTransform: number[][];
    debugExtra: IDebugExtra;
  }>;
  private _workerMatch;
  track(
    input: CanvasImageSource,
    modelViewTransform: number[][],
    targetIndex: number
  ): Promise<{
    worldCoords: {
      x: number;
      y: number;
      z: number;
    }[];
    screenCoords: {
      x: number;
      y: number;
    }[];
    debugExtra: import('./utils/types/detector').IDebugExtra;
  }>;
  trackUpdate(
    modelViewTransform: number[][],
    trackFeatures: ITrackingCoords
  ): Promise<number[][] | null>;
  private _workerTrackUpdate;
}

export default Controller;
