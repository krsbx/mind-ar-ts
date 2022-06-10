import { Tensor } from '@tensorflow/tfjs';
import FREAKPOINTS from '../../constant/freak';
import { FREAK_EXPANSION_FACTOR } from '../../constant/detector';
import { generateSubCodes, generateVariableName } from '../helper';

const computeExtremaFreak = (pyramidImagesT: Tensor[][], prunedExtremas: Tensor) => {
  const imageVariableNames: string[] = generateVariableName(pyramidImagesT);
  const pixelsSubCodes: string = generateSubCodes(pyramidImagesT);

  const kernel = {
    variableNames: [...imageVariableNames, 'extrema', 'angles', 'freakPoints'],
    outputShape: [prunedExtremas.shape[0], FREAKPOINTS.length],
    userCode: `
	  ${pixelsSubCodes}
	  void main() {
	    ivec2 coords = getOutputCoords();
	    int featureIndex = coords[0];
	    int freakIndex = coords[1];

	    float freakSigma = getFreakPoints(freakIndex, 0);
	    float freakX = getFreakPoints(freakIndex, 1);
	    float freakY = getFreakPoints(freakIndex, 2);

	    int octave = int(getExtrema(featureIndex, 1));
	    float inputY = getExtrema(featureIndex, 2);
	    float inputX = getExtrema(featureIndex, 3);
	    float inputAngle = getAngles(featureIndex);
            float cos = ${FREAK_EXPANSION_FACTOR}. * cos(inputAngle);
            float sin = ${FREAK_EXPANSION_FACTOR}. * sin(inputAngle);

	    float yp = inputY + freakX * sin + freakY * cos;
	    float xp = inputX + freakX * cos + freakY * -sin;

	    int x0 = int(floor(xp));
	    int x1 = x0 + 1;
	    int y0 = int(floor(yp));
	    int y1 = y0 + 1;

	    float f1 = getPixel(octave, y0, x0);
	    float f2 = getPixel(octave, y0, x1);
	    float f3 = getPixel(octave, y1, x0);
	    float f4 = getPixel(octave, y1, x1);

	    float x1f = float(x1);
	    float y1f = float(y1);
	    float x0f = float(x0);
	    float y0f = float(y0);

	    // ratio for interpolation between four neighbouring points
	    float value = (x1f - xp) * (y1f - yp) * f1
			+ (xp - x0f) * (y1f - yp) * f2
			+ (x1f - xp) * (yp - y0f) * f3
			+ (xp - x0f) * (yp - y0f) * f4;

	    setOutput(value);
	  }
	`,
  };

  return [kernel];
};

export default computeExtremaFreak;
