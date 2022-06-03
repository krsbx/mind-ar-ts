import { Matrix, inverse } from 'ml-matrix';
import { denormalizeHomography, normalizePoints } from './helper';

const solveHomography = (srcPoints: number[][], dstPoints: number[][]) => {
  const { normPoints: normSrcPoints, param: srcParam } = normalizePoints(srcPoints);
  const { normPoints: normDstPoints, param: dstParam } = normalizePoints(dstPoints);

  const num = normDstPoints.length;

  const AData = [];
  const BData = [];

  for (let j = 0; j < num; j++) {
    const row1 = [
      normSrcPoints[j][0],
      normSrcPoints[j][1],
      1,
      0,
      0,
      0,
      -(normSrcPoints[j][0] * normDstPoints[j][0]),
      -(normSrcPoints[j][1] * normDstPoints[j][0]),
    ];

    const row2 = [
      0,
      0,
      0,
      normSrcPoints[j][0],
      normSrcPoints[j][1],
      1,
      -(normSrcPoints[j][0] * normDstPoints[j][1]),
      -(normSrcPoints[j][1] * normDstPoints[j][1]),
    ];

    AData.push(row1);
    AData.push(row2);

    BData.push([normDstPoints[j][0]]);
    BData.push([normDstPoints[j][1]]);
  }

  try {
    const A = new Matrix(AData);
    const B = new Matrix(BData);

    const AT = A.transpose();
    const ATA = AT.mmul(A);
    const ATB = AT.mmul(B);
    const ATAInv = inverse(ATA);

    const C = ATAInv.mmul(ATB).to1DArray();

    const H = denormalizeHomography(C, srcParam, dstParam);

    return H;
  } catch (e) {
    return null;
  }
};

export default solveHomography;
