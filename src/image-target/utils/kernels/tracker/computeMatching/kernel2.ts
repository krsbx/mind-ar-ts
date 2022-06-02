const computeMatching = (
  searchOneSize: number,
  searchGap: number,
  searchSize: number,
  featureCount: number
) => {
  const kernel2 = {
    variableNames: ['featurePoints', 'markerProperties', 'maxIndex'],
    outputShape: [featureCount, 2], // [x, y]
    userCode: `
	  void main() {
	    ivec2 coords = getOutputCoords();

	    float markerScale = getMarkerProperties(2);

	    int featureIndex = coords[0];

	    int maxIndex = int(getMaxIndex(featureIndex));
	    int searchLocationIndex = maxIndex / ${searchSize * searchSize};
	    int searchOffsetIndex = imod(maxIndex, ${searchSize * searchSize});

	    if (coords[1] == 0) {
	      int searchOffsetX = imod(searchOffsetIndex, ${searchSize}) * ${searchGap};
	      setOutput(getFeaturePoints(featureIndex, 0) + float(searchOffsetX - ${searchOneSize}) / markerScale);
	    }
	    else if (coords[1] == 1) {
	      int searchOffsetY = searchOffsetIndex / ${searchSize} * ${searchGap};
	      setOutput(getFeaturePoints(featureIndex, 1) + float(searchOffsetY - ${searchOneSize}) / markerScale);
	    }
	  }
	`,
  };

  return kernel2;
};

export default computeMatching;
