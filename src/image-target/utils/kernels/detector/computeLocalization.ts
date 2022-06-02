import { Tensor } from '@tensorflow/tfjs';
import { generateSubCodes, generateVariableName } from '../helper';

const computeLocalization = (dogPyramidImagesT: Tensor[], prunedExtremasList: number[][]) => {
  const dogVariableNames: string[] = generateVariableName(dogPyramidImagesT);
  const dogSubCodes: string = generateSubCodes(dogPyramidImagesT);

  const kernel = {
    variableNames: [...dogVariableNames, 'extrema'],
    outputShape: [prunedExtremasList.length, 3, 3], // 3x3 pixels around the extrema
    userCode: `
	  ${dogSubCodes}

	  void main() {
	    ivec3 coords = getOutputCoords();
	    int featureIndex = coords[0];
	    float score = getExtrema(featureIndex, 0);
	    if (score == 0.0) {
	      return;
	    }

	    int dy = coords[1]-1;
	    int dx = coords[2]-1;
	    int octave = int(getExtrema(featureIndex, 1));
	    int y = int(getExtrema(featureIndex, 2));
	    int x = int(getExtrema(featureIndex, 3));
	    setOutput(getPixel(octave, y+dy, x+dx));
	  }
	`,
  };

  return [kernel];
};

export default computeLocalization;
