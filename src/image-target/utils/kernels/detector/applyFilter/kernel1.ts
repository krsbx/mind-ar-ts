const applyFilter = (imageHeight: number, imageWidth: number) => {
  const kernel = {
    variableNames: ['p'],
    outputShape: [imageHeight, imageWidth],
    userCode: `
	  void main() {
	    ivec2 coords = getOutputCoords();

	    float sum = getP(coords[0], coords[1]-2);
	    sum += getP(coords[0], coords[1]-1) * 4.;
	    sum += getP(coords[0], coords[1]) * 6.;
	    sum += getP(coords[0], coords[1]+1) * 4.;
	    sum += getP(coords[0], coords[1]+2);
	    setOutput(sum);
	  }
	`,
  };

  return kernel;
};

export default applyFilter;
