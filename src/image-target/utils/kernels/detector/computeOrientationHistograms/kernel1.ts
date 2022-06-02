import { Tensor } from '@tensorflow/tfjs';
import { ORIENTATION_NUM_BINS } from '../../../constant/detector';
import { generateSubCodes, generateVariableName } from '../../helper';

const computeOrientationHistograms = (
  pyramidImagesT: Tensor[][],
  prunedExtremasT: Tensor,
  radialPropertiesT: Tensor,
  oneOver2PI: number
) => {
  const imageVariableNames: string[] = generateVariableName(pyramidImagesT);
  const pixelsSubCodes: string = generateSubCodes(pyramidImagesT);

  const kernel = {
    variableNames: [...imageVariableNames, 'extrema', 'radial'],
    outputShape: [prunedExtremasT.shape[0], radialPropertiesT.shape[0], 2], // last dimension: [fbin, magnitude]
    userCode: `
	  ${pixelsSubCodes}

	  void main() {
	    ivec3 coords = getOutputCoords();
	    int featureIndex = coords[0];
	    int radialIndex = coords[1];
	    int propertyIndex = coords[2];

	    int radialY = int(getRadial(radialIndex, 0));
	    int radialX = int(getRadial(radialIndex, 1));
	    float radialW = getRadial(radialIndex, 2);

	    int octave = int(getExtrema(featureIndex, 1));
	    int y = int(getExtrema(featureIndex, 2));
	    int x = int(getExtrema(featureIndex, 3));

	    int xp = x + radialX;
	    int yp = y + radialY;

	    float dy = getPixel(octave, yp+1, xp) - getPixel(octave, yp-1, xp);
	    float dx = getPixel(octave, yp, xp+1) - getPixel(octave, yp, xp-1);

	    if (propertyIndex == 0) {
	      // be careful that atan(0, 0) gives 1.57 instead of 0 (different from js), but doesn't matter here, coz magnitude is 0
	      
	      float angle = atan(dy, dx) + ${Math.PI};
	      float fbin = angle * ${ORIENTATION_NUM_BINS}. * ${oneOver2PI};
	      setOutput(fbin);
	      return;
	    }

	    if (propertyIndex == 1) {
	      float mag = sqrt(dx * dx + dy * dy);
	      float magnitude = radialW * mag;
	      setOutput(magnitude);
	      return;
	    }
	  }

	`,
  };

  return kernel;
};

export default computeOrientationHistograms;
