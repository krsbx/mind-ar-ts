import { positions as canonicalMetricLandmarks, landmarkBasis } from './face-data';

const landmarkWeights: number[] = Array(canonicalMetricLandmarks.length).fill(0);

for (const [i, [, w]] of landmarkBasis.entries()) {
  landmarkWeights[i] = w;
}

export const sqrtWeights = landmarkWeights.map((w) => Math.sqrt(w));

// for computing solvePnP
export const majorLandmarkIndexes = [33, 263, 61, 291, 199];

for (const [index] of landmarkBasis) {
  if (!majorLandmarkIndexes.includes(index)) majorLandmarkIndexes.push(index);
}

majorLandmarkIndexes.sort((a, b) => a - b);

export let leftMostLandmarkIndex = 0;
export let rightMostLandmarkIndex = 0;

for (const [i, canonicalMetricLandmarkIndex] of canonicalMetricLandmarks.entries()) {
  if (canonicalMetricLandmarkIndex[0] < canonicalMetricLandmarks[leftMostLandmarkIndex][0]) {
    leftMostLandmarkIndex = i;
  }

  if (canonicalMetricLandmarkIndex[0] > canonicalMetricLandmarks[rightMostLandmarkIndex][0]) {
    rightMostLandmarkIndex = i;
  }
}
