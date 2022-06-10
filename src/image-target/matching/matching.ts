import TinyQueue from 'tinyqueue';
import hammingCompute from './hamming-distance';
import computeHoughMatches from './hough';
import computeHomography from './ransacHomography';
import { matrixInverse33, multiplyPointHomographyInhomogenous } from '../utils/geometry/matrix';
import {
  INLIER_THRESHOLD,
  MIN_NUM_INLIERS,
  CLUSTER_MAX_POP,
  HAMMING_THRESHOLD,
} from '../utils/constant/matching';
import { IKeyFrame, IMaximaMinimaPoint } from '../utils/types/compiler';
import { IDebugExtra, IMatches } from '../utils/types/detector';
import { INode, INodeQueue } from '../utils/types/matching';
import { Helper } from '../../libs';

// match list of querpoints against pre-built list of keyframes
const match = (options: {
  keyframe: IKeyFrame;
  querypoints: IMaximaMinimaPoint[];
  querywidth: number;
  queryheight: number;
  debugMode: boolean;
}) => {
  const { keyframe, querypoints, querywidth, queryheight, debugMode } = options;

  const debugExtra: IDebugExtra = {} as IDebugExtra;

  const matches = _getMatchesPoint({ keyframe, querypoints });

  if (debugMode) {
    debugExtra.matches = matches;
  }

  if (matches.length < MIN_NUM_INLIERS) return { debugExtra };

  const houghMatches = computeHoughMatches({
    keywidth: keyframe.width,
    keyheight: keyframe.height,
    querywidth,
    queryheight,
    matches,
  });

  if (debugMode) {
    debugExtra.houghMatches = houghMatches;
  }

  const H = computeHomography({
    srcPoints: houghMatches.map((m) => [m.keypoint.x, m.keypoint.y]),
    dstPoints: houghMatches.map((m) => [m.querypoint.x, m.querypoint.y]),
    keyframe,
  });

  if (H === null) return { debugExtra };

  const inlierMatches = _findInlierMatches({
    H,
    matches: houghMatches,
    threshold: INLIER_THRESHOLD,
  });

  if (debugMode) {
    debugExtra.inlierMatches = inlierMatches;
  }

  if (inlierMatches.length < MIN_NUM_INLIERS) return { debugExtra };

  // do another loop of match using the homography
  const HInv = matrixInverse33(H, 0.00001);

  if (!HInv) return { debugExtra };

  const matches2 = _getMatchesPoint2({
    keyframe,
    querypoints,
    HInv,
  });

  if (debugMode) {
    debugExtra.matches2 = matches2;
  }

  const houghMatches2 = computeHoughMatches({
    keywidth: keyframe.width,
    keyheight: keyframe.height,
    querywidth,
    queryheight,
    matches: matches2,
  });

  if (debugMode) {
    debugExtra.houghMatches2 = houghMatches2;
  }

  const H2 = computeHomography({
    srcPoints: houghMatches2.map((m) => [m.keypoint.x, m.keypoint.y]),
    dstPoints: houghMatches2.map((m) => [m.querypoint.x, m.querypoint.y]),
    keyframe,
  });

  if (H2 === null) return { debugExtra };

  const inlierMatches2 = _findInlierMatches({
    H: H2,
    matches: houghMatches2,
    threshold: INLIER_THRESHOLD,
  });

  if (debugMode) {
    debugExtra.inlierMatches2 = inlierMatches2;
  }

  return { H: H2, matches: inlierMatches2, debugExtra };
};

const _getMatchesPoint = (options: { keyframe: IKeyFrame; querypoints: IMaximaMinimaPoint[] }) => {
  const { keyframe, querypoints } = options;

  const matches: IMatches[] = [];

  for (const querypoint of querypoints) {
    const keypoints = querypoint.maxima ? keyframe.maximaPoints : keyframe.minimaPoints;

    if (keypoints.length === 0) continue;

    const rootNode = querypoint.maxima
      ? keyframe.maximaPointsCluster.rootNode
      : keyframe.minimaPointsCluster.rootNode;

    const keypointIndexes: number[] = [];

    const queue = new TinyQueue<INodeQueue>([], (a1, a2) => a1.d - a2.d);

    // query all potential keypoints
    _query({ node: rootNode, keypoints, querypoint, queue, keypointIndexes, numPop: 0 });

    let bestIndex = -1;
    let bestD1 = Number.MAX_SAFE_INTEGER;
    let bestD2 = Number.MAX_SAFE_INTEGER;

    for (let k = 0; k < keypointIndexes.length; k++) {
      const keypoint = keypoints[keypointIndexes[k]];

      const d = hammingCompute({ v1: keypoint.descriptors, v2: querypoint.descriptors });

      if (d < bestD1) {
        bestD2 = bestD1;
        bestD1 = d;
        bestIndex = keypointIndexes[k];
      } else if (d < bestD2) {
        bestD2 = d;
      }
    }

    if (
      bestIndex !== -1 &&
      (bestD2 === Number.MAX_SAFE_INTEGER || (1.0 * bestD1) / bestD2 < HAMMING_THRESHOLD)
    ) {
      matches.push({ querypoint, keypoint: keypoints[bestIndex] });
    }
  }

  return matches;
};

const _getMatchesPoint2 = (options: {
  keyframe: IKeyFrame;
  querypoints: IMaximaMinimaPoint[];
  HInv: number[];
}) => {
  const { keyframe, querypoints, HInv } = options;

  const dThreshold = 10 ** 2;
  const matches = [];

  for (const querypoint of querypoints) {
    const mapquerypoint = multiplyPointHomographyInhomogenous([querypoint.x, querypoint.y], HInv);

    let bestIndex = -1;
    let bestD1 = Number.MAX_SAFE_INTEGER;
    let bestD2 = Number.MAX_SAFE_INTEGER;

    const keypoints = querypoint.maxima ? keyframe.maximaPoints : keyframe.minimaPoints;

    for (const [k, keypoint] of keypoints.entries()) {
      // check distance threshold
      const d2 = (keypoint.x - mapquerypoint[0]) ** 2 + (keypoint.y - mapquerypoint[1]) ** 2;
      if (d2 > dThreshold) continue;

      const d = hammingCompute({ v1: keypoint.descriptors, v2: querypoint.descriptors });

      if (d < bestD1) {
        bestD2 = bestD1;
        bestD1 = d;
        bestIndex = k;
      } else if (d < bestD2) {
        bestD2 = d;
      }
    }

    if (
      bestIndex !== -1 &&
      (bestD2 === Number.MAX_SAFE_INTEGER || (1.0 * bestD1) / bestD2 < HAMMING_THRESHOLD)
    ) {
      matches.push({ querypoint, keypoint: keypoints[bestIndex] });
    }
  }

  return matches;
};

const _query = ({
  node,
  keypoints,
  querypoint,
  queue,
  keypointIndexes,
  numPop,
}: {
  node: INode;
  keypoints: IMaximaMinimaPoint[];
  querypoint: IMaximaMinimaPoint;
  queue: TinyQueue<INodeQueue>;
  keypointIndexes: number[];
  numPop: number;
}) => {
  if (node.leaf) {
    for (const pointIndex of node.pointIndexes) {
      keypointIndexes.push(pointIndex);
    }

    return;
  }

  const distances: number[] = [];

  for (const childNode of node.children) {
    const centerPointIndex = childNode.centerPointIndex;

    if (Helper.isNil(centerPointIndex)) continue;

    const d = hammingCompute({
      v1: keypoints[centerPointIndex].descriptors,
      v2: querypoint.descriptors,
    });

    distances.push(d);
  }

  const minD = Math.min(Number.MAX_SAFE_INTEGER, ...distances);

  for (const [i, childNode] of node.children.entries()) {
    if (distances[i] !== minD) {
      queue.push({ node: childNode, d: distances[i] });
    }
  }

  for (const [i, childNode] of node.children.entries()) {
    if (distances[i] === minD) {
      _query({ node: childNode, keypoints, querypoint, queue, keypointIndexes, numPop });
    }
  }

  if (numPop < CLUSTER_MAX_POP && queue.length > 0) {
    const popResult = queue.pop();

    if (popResult) {
      const { node } = popResult as INodeQueue;
      numPop += 1;

      _query({ node, keypoints, querypoint, queue, keypointIndexes, numPop });
    }
  }
};

const _findInlierMatches = (options: { H: number[]; matches: IMatches[]; threshold: number }) => {
  const { H, matches, threshold } = options;

  const thresholdSqr = threshold ** 2;

  const goodMatches: IMatches[] = [];

  for (const match of matches) {
    const { querypoint, keypoint } = match;

    const mp = multiplyPointHomographyInhomogenous([keypoint.x, keypoint.y], H);

    const d2 =
      (mp[0] - querypoint.x) * (mp[0] - querypoint.x) +
      (mp[1] - querypoint.y) * (mp[1] - querypoint.y);

    if (d2 <= thresholdSqr) {
      goodMatches.push(match);
    }
  }

  return goodMatches;
};

export default match;
