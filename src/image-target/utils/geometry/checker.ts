import { linePointSide } from './helper';

// srcPoints, dstPoints: array of four elements [x, y]
export const checkFourPointsConsistent = (
  x1: number[],
  x2: number[],
  x3: number[],
  x4: number[],
  x1p: number[],
  x2p: number[],
  x3p: number[],
  x4p: number[]
) => {
  if (linePointSide(x1, x2, x3) > 0 !== linePointSide(x1p, x2p, x3p) > 0) return false;
  if (linePointSide(x2, x3, x4) > 0 !== linePointSide(x2p, x3p, x4p) > 0) return false;
  if (linePointSide(x3, x4, x1) > 0 !== linePointSide(x3p, x4p, x1p) > 0) return false;
  if (linePointSide(x4, x1, x2) > 0 !== linePointSide(x4p, x1p, x2p) > 0) return false;

  return true;
};

export const checkThreePointsConsistent = (
  x1: number[],
  x2: number[],
  x3: number[],
  x1p: number[],
  x2p: number[],
  x3p: number[]
) => {
  if (linePointSide(x1, x2, x3) > 0 !== linePointSide(x1p, x2p, x3p) > 0) return false;

  return true;
};

// check if four points form a convex quadrilaternal.
// all four combinations should have same sign
export const quadrilateralConvex = (x1: number[], x2: number[], x3: number[], x4: number[]) => {
  const first = linePointSide(x1, x2, x3) <= 0;
  if (linePointSide(x2, x3, x4) <= 0 !== first) return false;
  if (linePointSide(x3, x4, x1) <= 0 !== first) return false;
  if (linePointSide(x4, x1, x2) <= 0 !== first) return false;

  return true;
};
