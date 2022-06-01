import { Tensor } from '@tensorflow/tfjs';
import { ORIENTATION_NUM_BINS } from '../../../constant/detector';

const computeOrientationHistograms = (prunedExtremasT: Tensor, radialPropertiesT: Tensor) => {
  const kernel = {
    variableNames: ['fbinMag'],
    outputShape: [prunedExtremasT.shape[0], ORIENTATION_NUM_BINS],
    userCode: `
	  void main() {
	    ivec2 coords = getOutputCoords();
	    int featureIndex = coords[0];
	    int binIndex = coords[1];

	    float sum = 0.;
	    for (int i = 0; i < ${radialPropertiesT.shape[0]}; i++) {
	      float fbin = getFbinMag(featureIndex, i, 0);
	      int bin = int(floor(fbin - 0.5));
	      int b1 = imod(bin + ${ORIENTATION_NUM_BINS}, ${ORIENTATION_NUM_BINS});
	      int b2 = imod(bin + 1 + ${ORIENTATION_NUM_BINS}, ${ORIENTATION_NUM_BINS});

	      if (b1 == binIndex || b2 == binIndex) {
		float magnitude = getFbinMag(featureIndex, i, 1);
		float w2 = fbin - float(bin) - 0.5;
		float w1 = w2 * -1. + 1.;

		if (b1 == binIndex) {
		  sum += w1 * magnitude;
		}
		if (b2 == binIndex) {
		  sum += w2 * magnitude;
		}
	      }
	    }
	    setOutput(sum);
	  }
	`,
  };

  return kernel;
};

export default computeOrientationHistograms;
