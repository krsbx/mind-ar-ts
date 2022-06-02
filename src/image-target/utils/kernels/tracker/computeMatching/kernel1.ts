const computeMatching = (
  templateOneSize: number,
  templateSize: number,
  searchOneSize: number,
  searchGap: number,
  searchSize: number,
  targetHeight: number,
  targetWidth: number,
  featureCount: number
) => {
  const kernel1 = {
    variableNames: ['features', 'markerPixels', 'markerProperties', 'targetPixels'],
    outputShape: [featureCount, searchSize * searchSize],
    userCode: `
	  void main() {
	    ivec2 coords = getOutputCoords();

	    int featureIndex = coords[0];
	    int searchOffsetIndex = coords[1];

	    int markerWidth = int(getMarkerProperties(0));
	    int markerHeight = int(getMarkerProperties(1));
	    float markerScale = getMarkerProperties(2);

	    int searchOffsetX = imod(searchOffsetIndex, ${searchSize}) * ${searchGap};
	    int searchOffsetY = searchOffsetIndex / ${searchSize} * ${searchGap};

	    int sCenterX = int(getFeatures(featureIndex, 0) * markerScale);
	    int sCenterY = int(getFeatures(featureIndex, 1) * markerScale);

	    int sx = sCenterX + searchOffsetX - ${searchOneSize};
	    int sy = sCenterY + searchOffsetY - ${searchOneSize};

	    if (sx < ${templateOneSize} || sx >= (${targetWidth} - ${templateOneSize}) || sy < ${templateOneSize} || sy >= (${targetHeight} - ${templateOneSize})) {
	      setOutput(-2.);
	    } 
	    else {
	      float sumPoint = 0.;
	      float sumPointSquare = 0.;
	      float sumTemplate = 0.;
	      float sumTemplateSquare = 0.;
	      float sumPointTemplate = 0.;

	      for (int templateOffsetY = 0; templateOffsetY < ${templateSize}; templateOffsetY++) {
		for (int templateOffsetX = 0; templateOffsetX < ${templateSize}; templateOffsetX++) {
		  int fx2 = sCenterX + templateOffsetX - ${templateOneSize};
		  int fy2 = sCenterY + templateOffsetY - ${templateOneSize};

		  int sx2 = sx + templateOffsetX - ${templateOneSize};
		  int sy2 = sy + templateOffsetY - ${templateOneSize};

		  int markerPixelIndex = fy2 * markerWidth + fx2;
		  float markerPixel = getMarkerPixels(markerPixelIndex);
		  float targetPixel = getTargetPixels(sy2, sx2);

		  sumTemplate += markerPixel;
		  sumTemplateSquare += markerPixel * markerPixel;
		  sumPoint += targetPixel;
		  sumPointSquare += targetPixel * targetPixel;
		  sumPointTemplate += targetPixel * markerPixel;
		}
	      }

	      // Normalized cross-correlation
	      // !important divide first avoid overflow (e.g. sumPoint / count * sumPoint)
	      float count = float(${templateSize} * ${templateSize});
	      float pointVariance = sqrt(sumPointSquare - sumPoint / count * sumPoint);
	      float templateVariance = sqrt(sumTemplateSquare - sumTemplate / count * sumTemplate);

	      if (pointVariance < 0.0000001) {
		setOutput(-3.);
	      } else if (templateVariance < 0.0000001) {
		//setOutput(sumTemplate);
		setOutput(-4.);
	      } else {
		sumPointTemplate -= sumPoint / count * sumTemplate;
		float sim = sumPointTemplate / pointVariance / templateVariance;  
		setOutput(sim);
	      }
	    }
	  }
	`,
  };

  return kernel1;
};

export default computeMatching;
