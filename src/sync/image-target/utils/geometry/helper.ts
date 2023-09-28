export const vector2DDistance = (vecA: number[], vecB: number[]) => [
  vecA[0] - vecB[0],
  vecA[1] - vecB[1],
];

export const areaOfTriangle = (u: number[], v: number[]) => {
  const a = u[0] * v[1] - u[1] * v[0];

  return Math.abs(a) * 0.5;
};

// check which side point C on the line from A to B
export const linePointSide = (A: number[], B: number[], C: number[]) =>
  (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);

export const determinant = (A: number[]) => {
  const C1 = A[4] * A[8] - A[5] * A[7];
  const C2 = A[3] * A[8] - A[5] * A[6];
  const C3 = A[3] * A[7] - A[4] * A[6];

  return A[0] * C1 - A[1] * C2 + A[2] * C3;
};
