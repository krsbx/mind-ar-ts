import {
  EDGE_HESSIAN_THRESHOLD,
  FREAK_EXPANSION_FACTOR,
  LAPLACIAN_SQR_THRESHOLD,
} from '../../constant/detector';

const buildExtremas = (imageHeight: number, imageWidth: number) => {
  const kernel = {
    variableNames: ['image0', 'image1', 'image2'],
    outputShape: [imageHeight, imageWidth],
    userCode: `
	  void main() {
	    ivec2 coords = getOutputCoords();

	    int y = coords[0];
	    int x = coords[1];

	    float value = getImage1(y, x);

	    // Step 1: find local maxima/minima
	    if (value * value < ${LAPLACIAN_SQR_THRESHOLD}.) {
	      setOutput(0.);
	      return;
	    }
	    if (y < ${FREAK_EXPANSION_FACTOR} || y > ${imageHeight - 1 - FREAK_EXPANSION_FACTOR}) {
	      setOutput(0.);
	      return;
	    }
	    if (x < ${FREAK_EXPANSION_FACTOR} || x > ${imageWidth - 1 - FREAK_EXPANSION_FACTOR}) {
	      setOutput(0.);
	      return;
	    }

	    bool isMax = true;
	    bool isMin = true;
	    for (int dy = -1; dy <= 1; dy++) {
	      for (int dx = -1; dx <= 1; dx++) {
	        float value0 = getImage0(y+dy, x+dx);
	        float value1 = getImage1(y+dy, x+dx);
	        float value2 = getImage2(y+dy, x+dx);

		if (value < value0 || value < value1 || value < value2) {
		  isMax = false;
		}
		if (value > value0 || value > value1 || value > value2) {
		  isMin = false;
		}
	      }
	    }

	    if (!isMax && !isMin) {
	      setOutput(0.);
	      return;
	    }

	    // compute edge score and reject based on threshold
	    float dxx = getImage1(y, x+1) + getImage1(y, x-1) - 2. * getImage1(y, x);
	    float dyy = getImage1(y+1, x) + getImage1(y-1, x) - 2. * getImage1(y, x);
	    float dxy = 0.25 * (getImage1(y-1,x-1) + getImage1(y+1,x+1) - getImage1(y-1,x+1) - getImage1(y+1,x-1));

	    float det = (dxx * dyy) - (dxy * dxy);

	    if (abs(det) < 0.0001) { // determinant undefined. no solution
	      setOutput(0.);
	      return;
	    }

	    float edgeScore = (dxx + dyy) * (dxx + dyy) / det;

	    if (abs(edgeScore) >= ${EDGE_HESSIAN_THRESHOLD} ) {
	      setOutput(0.);
	      return;
	    }
	    setOutput(getImage1(y,x));
	  }
	`,
  };

  return kernel;
};

export default buildExtremas;
