import { Tensor } from '@tensorflow/tfjs';
import kernel1 from './kernel1';
import kernel2 from './kernel2';

const computeOrientationHistograms = (
  pyramidImagesT: Tensor[][],
  prunedExtremasT: Tensor,
  radialPropertiesT: Tensor,
  oneOver2PI: number
) => {
  const KERNEL1 = kernel1(pyramidImagesT, prunedExtremasT, radialPropertiesT, oneOver2PI);
  const KERNEL2 = kernel2(prunedExtremasT, radialPropertiesT);

  return [KERNEL1, KERNEL2];
};

export default computeOrientationHistograms;
