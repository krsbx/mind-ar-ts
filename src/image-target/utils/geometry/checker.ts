import { linePointSide } from './helper';

// srcPoints, dstPoints: array of four elements [x, y]
const checkFourPointsConsistent = (
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

const checkThreePointsConsistent = (
  x1: number[],
  x2: number[],
  x3: number[],
  x1p: number[],
  x2p: number[],
  x3p: number[]
) => {
  const point1 = linePointSide(x1, x2, x3) > 0;
  const point2 = linePointSide(x1p, x2p, x3p) > 0;

  return point1 === point2;
};

export { checkFourPointsConsistent, checkThreePointsConsistent };
