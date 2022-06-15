import OneEuroFilter from '../../../libs/one-euro-filter';
import { ON_UPDATE_EVENT, WORKER_EVENT } from '../constant/controller';
import { IKeyFrame, IMaximaMinimaPoint } from './compiler';

export type WorkerEvent = typeof WORKER_EVENT[keyof typeof WORKER_EVENT];

export type OnUpdateEvent = typeof ON_UPDATE_EVENT[keyof typeof ON_UPDATE_EVENT];

export interface IOnUpdate {
  type: typeof ON_UPDATE_EVENT[keyof typeof ON_UPDATE_EVENT];
  targetIndex?: number | null;
  worldMatrix?: number[] | null;
}

export interface IControllerWorkerResult {
  SETUP: void;
  MATCH: {
    targetIndex: number;
    modelViewTransform: number[][];
    debugExtra: IDebugExtra;
  };
  TRACK_UPDATE: {
    modelViewTransform: number[][];
  };
}

export interface IControllerWorker {
  SETUP: {
    type: typeof WORKER_EVENT.SETUP;
    inputWidth: number;
    inputHeight: number;
    projectionTransform: number[][];
    debugMode: boolean;
    matchingDataList: IKeyFrame[][];
  };
  MATCH: {
    type: typeof WORKER_EVENT.MATCH;
    featurePoints: IMaximaMinimaPoint[];
    targetIndexes: number[];
  };
  TRACK_UPDATE: {
    type: typeof WORKER_EVENT.TRACK_UPDATE;
    modelViewTransform: number[][];
    worldCoords: Vector3[];
    screenCoords: Vector2[];
  };
}

export interface ITrackingState {
  showing: boolean;
  isTracking: boolean;
  currentModelViewTransform: number[][] | null;
  trackCount: number;
  trackMiss: number;
  filter: OneEuroFilter;
  trackingMatrix: number[] | null;
}

export interface ITrackingCoords {
  screenCoords: Vector2[];
  worldCoords: Vector3[];
}
