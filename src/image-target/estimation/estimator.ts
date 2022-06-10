import { IRefineEstimations } from '../utils/types/estimation';
import estimate from './estimate';
import refineEstimate from './refine-estimate';

class Estimator {
  private projectionTransform: number[][];

  constructor(projectionTransform: number[][]) {
    this.projectionTransform = projectionTransform;
  }

  // Solve homography between screen points and world points using Direct Linear Transformation
  // then decompose homography into rotation and translation matrix (i.e. modelViewTransform)
  estimate({ screenCoords, worldCoords }: { screenCoords: Vector2[]; worldCoords: Vector3[] }) {
    const modelViewTransform = estimate({
      screenCoords,
      worldCoords,
      projectionTransform: this.projectionTransform,
    });

    return modelViewTransform;
  }

  // Given an initial guess of the modelViewTransform and new pairs of screen-world coordinates,
  // use Iterative Closest Point to refine the transformation
  //refineEstimate({initialModelViewTransform, screenCoords, worldCoords}) {
  refineEstimate({
    initialModelViewTransform,
    worldCoords,
    screenCoords,
  }: Omit<IRefineEstimations, 'projectionTransform'>) {
    const updatedModelViewTransform = refineEstimate({
      initialModelViewTransform,
      worldCoords,
      screenCoords,
      projectionTransform: this.projectionTransform,
    });

    return updatedModelViewTransform;
  }
}

export default Estimator;
