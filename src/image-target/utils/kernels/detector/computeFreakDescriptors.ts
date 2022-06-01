import { Tensor } from '@tensorflow/tfjs';

const computeFreakDescriptors = (
  extremaFreaks: Tensor,
  descriptorCount: number,
  FREAK_CONPARISON_COUNT: number
) => {
  const kernel = {
    variableNames: ['freak', 'p'],
    outputShape: [extremaFreaks.shape[0], descriptorCount],
    userCode: `
	  void main() {
	    ivec2 coords = getOutputCoords();
	    int featureIndex = coords[0];
	    int descIndex = coords[1] * 8;

	    int sum = 0;
	    for (int i = 0; i < 8; i++) {
	      if (descIndex + i >= ${FREAK_CONPARISON_COUNT}) {
		continue;
	      }

	      int p1 = int(getP(descIndex + i, 0));
	      int p2 = int(getP(descIndex + i, 1));

	      float v1 = getFreak(featureIndex, p1);
	      float v2 = getFreak(featureIndex, p2);

	      if (v1 < v2 + 0.01) {
	        sum += int(pow(2.0, float(7 - i)));
	      }
	    }
	    setOutput(float(sum));
	  }
	`,
  };

  return [kernel];
};

export default computeFreakDescriptors;
