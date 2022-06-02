import { Tensor } from '@tensorflow/tfjs';

const generateVariableName = (pyramidImagesT: Tensor[] | Tensor[][]) => {
  const imageVariableNames: string[] = [];

  for (let i = 1; i < pyramidImagesT.length; i++) {
    imageVariableNames.push('image' + i);
  }

  return imageVariableNames;
};

const generateSubCodes = (pyramidImagesT: Tensor[] | Tensor[][]) => {
  let pixelsSubCodes = `float getPixel(int octave, int y, int x) {`;

  for (let i = 1; i < pyramidImagesT.length; i++)
    pixelsSubCodes += `
	  if (octave == ${i}) {
	    return getImage${i}(y, x);
	  }
	`;

  pixelsSubCodes += `}`;

  return pixelsSubCodes;
};

export { generateVariableName, generateSubCodes };
