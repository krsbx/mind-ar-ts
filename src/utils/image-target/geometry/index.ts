import { smallestTriangleArea } from './area';
import { checkFourPointsConsistent, checkThreePointsConsistent } from './checker';
import { determinant, linePointSide } from './helper';
import { matrixInverse33, matrixMul33, multiplyPointHomographyInhomogenous } from './matrix';

// check if four points form a convex quadrilaternal.
// all four combinations should have same sign
const quadrilateralConvex = (x1: number[], x2: number[], x3: number[], x4: number[]) => {
  const first = linePointSide(x1, x2, x3) <= 0;

  if (linePointSide(x2, x3, x4) <= 0 !== first) return false;
  if (linePointSide(x3, x4, x1) <= 0 !== first) return false;
  if (linePointSide(x4, x1, x2) <= 0 !== first) return false;

  return true;
};

export {
  matrixInverse33,
  matrixMul33,
  quadrilateralConvex,
  smallestTriangleArea,
  multiplyPointHomographyInhomogenous,
  checkThreePointsConsistent,
  checkFourPointsConsistent,
  determinant,
};
