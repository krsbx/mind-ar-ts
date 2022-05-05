import * as tf from '@tensorflow/tfjs';

const generateVariableName = (pyramidImagesT: tf.Tensor<tf.Rank>[] | tf.Tensor<tf.Rank>[][]) => {
  const imageVariableNames: string[] = [];

  for (let i = 1; i < pyramidImagesT.length; i++) {
    imageVariableNames.push('image' + i);
  }

  return imageVariableNames;
};

const generateSubCodes = (pyramidImagesT: tf.Tensor<tf.Rank>[] | tf.Tensor<tf.Rank>[][]) => {
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
