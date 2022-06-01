import { PRECISION_ADJUST } from '../../constant/tracker';

const computeProjection = (markerHeight: number, markerWidth: number, markerScale: number) => {
  const kernel = {
    variableNames: ['M', 'pixel'],
    outputShape: [markerHeight, markerWidth],
    userCode: `
	  void main() {
	      ivec2 coords = getOutputCoords();

	      float m00 = getM(0, 0) * ${PRECISION_ADJUST}.;
	      float m01 = getM(0, 1) * ${PRECISION_ADJUST}.;
	      float m03 = getM(0, 3) * ${PRECISION_ADJUST}.;
	      float m10 = getM(1, 0) * ${PRECISION_ADJUST}.;
	      float m11 = getM(1, 1) * ${PRECISION_ADJUST}.;
	      float m13 = getM(1, 3) * ${PRECISION_ADJUST}.;
	      float m20 = getM(2, 0) * ${PRECISION_ADJUST}.;
	      float m21 = getM(2, 1) * ${PRECISION_ADJUST}.;
	      float m23 = getM(2, 3) * ${PRECISION_ADJUST}.;

	      float y = float(coords[0]) / float(${markerScale});
	      float x = float(coords[1]) / float(${markerScale});
	      float uz = (x * m20) + (y * m21) + m23;
	      float oneOverUz = 1. / uz;

	      float ux = (x * m00) + (y * m01) + m03;
	      float uy = (x * m10) + (y * m11) + m13;

	      ux = floor(ux * oneOverUz + 0.5);
	      uy = floor(uy * oneOverUz + 0.5);
	      setOutput(getPixel(int(uy), int(ux)));
	    }
	`,
  };

  return kernel;
};

export default computeProjection;
