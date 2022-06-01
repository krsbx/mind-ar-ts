const computeMatching = (featureCount: number) => {
  const kernel3 = {
    variableNames: ['sims', 'maxIndex'],
    outputShape: [featureCount],
    userCode: `
	  void main() {
	    int featureIndex = getOutputCoords();
	    int maxIndex = int(getMaxIndex(featureIndex));
	    setOutput(getSims(featureIndex, maxIndex));
	  }
	`,
  };

  return kernel3;
};

export default computeMatching;
