import { IRefineEstimations } from '../../src/image-target/utils/types/estimation';

declare class Estimator {
  private projectionTransform;
  constructor(projectionTransform: number[][]);
  estimate({
    screenCoords,
    worldCoords,
  }: {
    screenCoords: Vector2[];
    worldCoords: Vector3[];
  }): number[][] | null;
  refineEstimate({
    initialModelViewTransform,
    worldCoords,
    screenCoords,
  }: Omit<IRefineEstimations, 'projectionTransform'>): number[][] | null;
}

export default Estimator;
