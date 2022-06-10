import { areaOfTriangle, vector2DDistance } from './helper';

export const smallestTriangleArea = (x1: number[], x2: number[], x3: number[], x4: number[]) => {
  const v12 = vector2DDistance(x2, x1);
  const v13 = vector2DDistance(x3, x1);
  const v14 = vector2DDistance(x4, x1);
  const v32 = vector2DDistance(x2, x3);
  const v34 = vector2DDistance(x4, x3);

  const a1 = areaOfTriangle(v12, v13);
  const a2 = areaOfTriangle(v13, v14);
  const a3 = areaOfTriangle(v12, v14);
  const a4 = areaOfTriangle(v32, v34);

  return Math.min(a1, a2, a3, a4);
};
