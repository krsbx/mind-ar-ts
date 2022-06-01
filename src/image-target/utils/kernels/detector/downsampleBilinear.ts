const downsampleBilinear = (imageHeight: number, imageWidth: number) => {
  const kernel = {
    variableNames: ['p'],
    outputShape: [Math.floor(imageHeight / 2), Math.floor(imageWidth / 2)],
    userCode: `
	  void main() {
	    ivec2 coords = getOutputCoords();
	    int y = coords[0] * 2;
	    int x = coords[1] * 2;

	    float sum = getP(y, x) * 0.25;
	    sum += getP(y+1,x) * 0.25; 
	    sum += getP(y, x+1) * 0.25; 
	    sum += getP(y+1,x+1) * 0.25;
	    setOutput(sum);
	  }
	`,
  };

  return kernel;
};

export default downsampleBilinear;
