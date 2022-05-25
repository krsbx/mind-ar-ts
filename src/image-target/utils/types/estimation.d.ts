export interface IRefineEstimations {
  initialModelViewTransform: number[][];
  projectionTransform: number[][];
  worldCoords: Vector3[];
  screenCoords: Vector2[];
}

export interface IICP extends IRefineEstimations {
  inlierProb: number;
}

export interface IUpdateViewTransform {
  modelViewTransform: number[][];
  dS: number[];
}
