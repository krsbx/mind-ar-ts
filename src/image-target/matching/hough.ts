import { IMaximaMinimaPoint } from '../utils/types/compiler';
import { IMatches } from '../utils/types/detector';
import { IQueryBinLocation } from '../utils/types/matching';

const kHoughBinDelta = 1;

// mathces [querypointIndex:x, keypointIndex: x]
const computeHoughMatches = (options: {
  keywidth: number;
  keyheight: number;
  querywidth: number;
  queryheight: number;
  matches: IMatches[];
}) => {
  const { keywidth, keyheight, querywidth, queryheight, matches } = options;

  const maxX = querywidth * 1.2;
  const minX = -maxX;

  const maxY = queryheight * 1.2;
  const minY = -maxY;

  const numAngleBins = 12;
  const numScaleBins = 10;

  const minScale = -1;
  const maxScale = 1;

  const scaleK = 10.0;
  const scaleOneOverLogK = 1.0 / Math.log(scaleK);

  const maxDim = Math.max(keywidth, keyheight);

  const keycenterX = Math.floor(keywidth / 2);
  const keycenterY = Math.floor(keyheight / 2);

  // compute numXBins and numYBins based on matches
  const projectedDims: number[] = [];

  for (const match of matches) {
    const queryscale = match.querypoint.scale;
    const keyscale = match.keypoint.scale;

    if (keyscale == 0) {
      console.error('ERROR divide zero');
      continue;
    }

    const scale = queryscale / keyscale;
    projectedDims.push(scale * maxDim);
  }

  // TODO optimize median
  //   weird. median should be [Math.floor(projectedDims.length/2) - 1] ?
  projectedDims.sort((a1, a2) => a1 - a2);

  const medianProjectedDim =
    projectedDims[
      Math.floor(projectedDims.length / 2) - (projectedDims.length % 2 == 0 ? 1 : 0) - 1
    ];

  const binSize = 0.25 * medianProjectedDim;
  const numXBins = Math.max(5, Math.ceil((maxX - minX) / binSize));
  const numYBins = Math.max(5, Math.ceil((maxY - minY) / binSize));

  const numXYBins = numXBins * numYBins;
  const numXYAngleBins = numXYBins * numAngleBins;

  // do voting
  const querypointValids: boolean[] = [];
  const querypointBinLocations: IQueryBinLocation[] = [];
  const votes: Record<number, number> = {};

  for (const [i, match] of matches.entries()) {
    const { keypoint, querypoint } = match;

    const { x, y, scale, angle } = _mapCorrespondence({
      querypoint,
      keypoint,
      keycenterX,
      keycenterY,
      scaleOneOverLogK,
    });

    // Check that the vote is within range
    if (
      x < minX ||
      x >= maxX ||
      y < minY ||
      y >= maxY ||
      angle <= -Math.PI ||
      angle > Math.PI ||
      scale < minScale ||
      scale >= maxScale
    ) {
      querypointValids[i] = false;
      continue;
    }

    // map properties to bins
    const fbinX = (numXBins * (x - minX)) / (maxX - minX);
    const fbinY = (numYBins * (y - minY)) / (maxY - minY);

    const fbinAngle = (numAngleBins * (angle + Math.PI)) / (2.0 * Math.PI);
    const fbinScale = (numScaleBins * (scale - minScale)) / (maxScale - minScale);

    querypointBinLocations[i] = {
      binX: fbinX,
      binY: fbinY,
      binAngle: fbinAngle,
      binScale: fbinScale,
    };

    const binX = Math.floor(fbinX - 0.5);
    const binY = Math.floor(fbinY - 0.5);

    const binScale = Math.floor(fbinScale - 0.5);
    const binAngle = (Math.floor(fbinAngle - 0.5) + numAngleBins) % numAngleBins;

    // check can vote all 16 bins
    if (
      binX < 0 ||
      binX + 1 >= numXBins ||
      binY < 0 ||
      binY + 1 >= numYBins ||
      binScale < 0 ||
      binScale + 1 >= numScaleBins
    ) {
      querypointValids[i] = false;
      continue;
    }

    for (let dx = 0; dx < 2; dx++) {
      const binX2 = binX + dx;

      for (let dy = 0; dy < 2; dy++) {
        const binY2 = binY + dy;

        for (let dangle = 0; dangle < 2; dangle++) {
          const binAngle2 = (binAngle + dangle) % numAngleBins;

          for (let dscale = 0; dscale < 2; dscale++) {
            const binScale2 = binScale + dscale;

            const binIndex =
              binX2 + binY2 * numXBins + binAngle2 * numXYBins + binScale2 * numXYAngleBins;

            if (votes[binIndex] === undefined) votes[binIndex] = 0;

            votes[binIndex] += 1;
          }
        }
      }
    }

    querypointValids[i] = true;
  }

  let maxVotes = 0;
  let maxVoteIndex = -1;

  Object.keys(votes).forEach((index) => {
    const newIndex = +index;

    if (votes[newIndex] > maxVotes) {
      maxVotes = votes[newIndex];
      maxVoteIndex = newIndex;
    }
  });

  if (maxVotes < 3) return [];

  // get back bins from vote index
  const binX = Math.floor(((maxVoteIndex % numXYAngleBins) % numXYBins) % numXBins);
  const binY = Math.floor((((maxVoteIndex - binX) % numXYAngleBins) % numXYBins) / numXBins);

  const binAngle = Math.floor(
    ((maxVoteIndex - binX - binY * numXBins) % numXYAngleBins) / numXYBins
  );
  const binScale = Math.floor(
    (maxVoteIndex - binX - binY * numXBins - binAngle * numXYBins) / numXYAngleBins
  );

  const houghMatches: IMatches[] = [];

  for (let i = 0; i < matches.length; i++) {
    if (!querypointValids[i]) continue;

    const queryBins = querypointBinLocations[i];

    // compute bin difference
    const distBinX = Math.abs(queryBins.binX - (binX + 0.5));
    if (distBinX >= kHoughBinDelta) continue;

    const distBinY = Math.abs(queryBins.binY - (binY + 0.5));
    if (distBinY >= kHoughBinDelta) continue;

    const distBinScale = Math.abs(queryBins.binScale - (binScale + 0.5));
    if (distBinScale >= kHoughBinDelta) continue;

    const temp = Math.abs(queryBins.binAngle - (binAngle + 0.5));

    const distBinAngle = Math.min(temp, numAngleBins - temp);
    if (distBinAngle >= kHoughBinDelta) continue;

    houghMatches.push(matches[i]);
  }

  return houghMatches;
};

const _mapCorrespondence = ({
  querypoint,
  keypoint,
  keycenterX,
  keycenterY,
  scaleOneOverLogK,
}: {
  querypoint: IMaximaMinimaPoint;
  keypoint: IMaximaMinimaPoint;
  keycenterX: number;
  keycenterY: number;
  scaleOneOverLogK: number;
}) => {
  // map angle to (-pi, pi]
  let angle = querypoint.angle - keypoint.angle;

  if (angle <= -Math.PI) angle += 2 * Math.PI;
  else if (angle > Math.PI) angle -= 2 * Math.PI;

  const scale = querypoint.scale / keypoint.scale;

  // 2x2 similarity
  const cos = scale * Math.cos(angle);
  const sin = scale * Math.sin(angle);
  const S = [cos, -sin, sin, cos];

  const tp = [S[0] * keypoint.x + S[1] * keypoint.y, S[2] * keypoint.x + S[3] * keypoint.y];
  const tx = querypoint.x - tp[0];
  const ty = querypoint.y - tp[1];

  return {
    x: S[0] * keycenterX + S[1] * keycenterY + tx,
    y: S[2] * keycenterX + S[3] * keycenterY + ty,
    angle,
    scale: Math.log(scale) * scaleOneOverLogK,
  };
};

export default computeHoughMatches;
