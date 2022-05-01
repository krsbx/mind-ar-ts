import { Vector3 } from 'three';

export interface IRefineEstimations {
  initialModelViewTransform: number[][];
  projectionTransform: number[][];
  worldCoords: Vector3[];
  screenCoords: Vector3[];
}

export interface IICP extends IRefineEstimations {
  inlierProb: number;
}

export interface IUpdateViewTransform {
  modelViewTransform: number[][];
  dS: number[];
}
