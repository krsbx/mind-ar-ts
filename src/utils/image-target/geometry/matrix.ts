import { determinant } from './helper';

const matrixInverse33 = (A: number[], threshold: number) => {
  const det = determinant(A);

  if (Math.abs(det) <= threshold) return null;

  const oneOver = 1.0 / det;
  const B = [
    (A[4] * A[8] - A[5] * A[7]) * oneOver,
    (A[2] * A[7] - A[1] * A[8]) * oneOver,
    (A[1] * A[5] - A[2] * A[4]) * oneOver,
    (A[5] * A[6] - A[3] * A[8]) * oneOver,
    (A[0] * A[8] - A[2] * A[6]) * oneOver,
    (A[2] * A[3] - A[0] * A[5]) * oneOver,
    (A[3] * A[7] - A[4] * A[6]) * oneOver,
    (A[1] * A[6] - A[0] * A[7]) * oneOver,
    (A[0] * A[4] - A[1] * A[3]) * oneOver,
  ];

  return B;
};

const matrixMul33 = (A: number[], B: number[]) => {
  const C = [];
  C[0] = A[0] * B[0] + A[1] * B[3] + A[2] * B[6];
  C[1] = A[0] * B[1] + A[1] * B[4] + A[2] * B[7];
  C[2] = A[0] * B[2] + A[1] * B[5] + A[2] * B[8];
  C[3] = A[3] * B[0] + A[4] * B[3] + A[5] * B[6];
  C[4] = A[3] * B[1] + A[4] * B[4] + A[5] * B[7];
  C[5] = A[3] * B[2] + A[4] * B[5] + A[5] * B[8];
  C[6] = A[6] * B[0] + A[7] * B[3] + A[8] * B[6];
  C[7] = A[6] * B[1] + A[7] * B[4] + A[8] * B[7];
  C[8] = A[6] * B[2] + A[7] * B[5] + A[8] * B[8];

  return C;
};

const multiplyPointHomographyInhomogenous = (x: number[], H: number[]) => {
  const w = H[6] * x[0] + H[7] * x[1] + H[8];
  const xp = [];
  xp[0] = (H[0] * x[0] + H[1] * x[1] + H[2]) / w;
  xp[1] = (H[3] * x[0] + H[4] * x[1] + H[5]) / w;

  return xp;
};

export { matrixInverse33, matrixMul33, multiplyPointHomographyInhomogenous };
