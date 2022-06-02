import { Tensor } from '@tensorflow/tfjs';
import { ORIENTATION_NUM_BINS } from '../../constant/detector';

const smoothHistograms = (histograms: Tensor) => {
  const kernel = {
    variableNames: ['histogram'],
    outputShape: [histograms.shape[0], ORIENTATION_NUM_BINS],
    userCode: `
	  void main() {
	    ivec2 coords = getOutputCoords();

	    int featureIndex = coords[0];
	    int binIndex = coords[1];

	    int prevBin = imod(binIndex - 1 + ${ORIENTATION_NUM_BINS}, ${ORIENTATION_NUM_BINS});
	    int nextBin = imod(binIndex + 1, ${ORIENTATION_NUM_BINS});

            float result = 0.274068619061197 * getHistogram(featureIndex, prevBin) + 0.451862761877606 * getHistogram(featureIndex, binIndex) + 0.274068619061197 * getHistogram(featureIndex, nextBin);

	    setOutput(result);
	  }
	`,
  };

  return kernel;
};

export default smoothHistograms;
