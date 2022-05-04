import { compute as hammingCompute } from './hamming-distance';
import { createRandomizer } from '../utils';
import { INode, RandomizerType } from '../utils/types/matching';
import { IMaximaMinimaPoint } from '../utils/types/compiler';
import { Helper } from '../../libs';

const MIN_FEATURE_PER_NODE = 16;
const NUM_ASSIGNMENT_HYPOTHESES = 128;
const NUM_CENTERS = 8;
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

const _computeKMedoids = (options: {
  points: IMaximaMinimaPoint[];
  pointIndexes: number[];
  randomizer: RandomizerType;
}) => {
  const { points, pointIndexes, randomizer } = options;

  const randomPointIndexes = [];
  for (let i = 0; i < pointIndexes.length; i++) {
    randomPointIndexes.push(i);
  }

  let bestSumD = MAX_SAFE_INTEGER;
  let bestAssignmentIndex = -1;

  const assignments = [];
  for (let i = 0; i < NUM_ASSIGNMENT_HYPOTHESES; i++) {
    randomizer.arrayShuffle({ arr: randomPointIndexes, sampleSize: NUM_CENTERS });

    let sumD = 0;
    const assignment = [];
    for (let j = 0; j < pointIndexes.length; j++) {
      let bestD = MAX_SAFE_INTEGER;
      for (let k = 0; k < NUM_CENTERS; k++) {
        const centerIndex = pointIndexes[randomPointIndexes[k]];

        const d = hammingCompute({
          v1: points[pointIndexes[j]].descriptors,
          v2: points[centerIndex].descriptors,
        });

        if (d < bestD) {
          assignment[j] = randomPointIndexes[k];
          bestD = d;
        }
      }

      sumD += bestD;
    }

    assignments.push(assignment);

    if (sumD < bestSumD) {
      bestSumD = sumD;
      bestAssignmentIndex = i;
    }
  }

  return assignments[bestAssignmentIndex];
};

// kmedoids clustering of points, with hamming distance of FREAK descriptor
//
// node = {
//   isLeaf: bool,
//   children: [], list of children node
//   pointIndexes: [], list of int, point indexes
//   centerPointIndex: int
// }
const build = ({ points }: { points: IMaximaMinimaPoint[] }) => {
  const pointIndexes: number[] = [];

  for (let i = 0; i < points.length; i++) {
    pointIndexes.push(i);
  }

  const randomizer = createRandomizer();

  const rootNode = _build({
    points,
    pointIndexes,
    centerPointIndex: null,
    randomizer,
  });

  return { rootNode };
};

// recursive build hierarchy clusters
const _build = (options: {
  points: IMaximaMinimaPoint[];
  pointIndexes: number[];
  centerPointIndex: number | null;
  randomizer: RandomizerType;
}) => {
  const { points, pointIndexes, centerPointIndex, randomizer } = options;

  let isLeaf = false;

  if (pointIndexes.length <= NUM_CENTERS || pointIndexes.length <= MIN_FEATURE_PER_NODE) {
    isLeaf = true;
  }

  const clusters: number[][] = [];

  if (!isLeaf) {
    // compute clusters
    const assignment = _computeKMedoids({ points, pointIndexes, randomizer });

    for (let i = 0; i < assignment.length; i++) {
      if (Helper.isNil(clusters[pointIndexes[assignment[i]]]))
        clusters[pointIndexes[assignment[i]]] = [];

      clusters[pointIndexes[assignment[i]]].push(pointIndexes[i]);
    }
  }

  if (Object.keys(clusters).length === 1) isLeaf = true;

  const node: INode = {
    centerPointIndex,
  } as INode;

  if (isLeaf) {
    node.leaf = true;
    node.pointIndexes = [];

    for (let i = 0; i < pointIndexes.length; i++) node.pointIndexes.push(pointIndexes[i]);

    return node;
  }

  // recursive build children
  node.leaf = false;
  node.children = [];

  Object.keys(clusters).forEach((id) => {
    const centerIndex = Number(id);

    node.children.push(
      _build({
        points: points,
        pointIndexes: clusters[centerIndex],
        centerPointIndex: centerIndex,
        randomizer,
      })
    );
  });

  return node;
};

export { build };
