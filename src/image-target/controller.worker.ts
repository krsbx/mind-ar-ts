import { Matcher } from './matching/matcher';
import { Estimator } from './estimation/estimator';
import { WorkerEvent } from './utils/types/controller';
import { WORKER_EVENT } from './utils/constant/controller';

let matchingDataList: any[] = [];
let debugMode = false;
let matcher: Matcher;
let estimator: Estimator;

const setup = (data: any) => {
  matchingDataList = data.matchingDataList;
  debugMode = data.debugMode;
  matcher = new Matcher(data.inputWidth, data.inputHeight, debugMode);
  estimator = new Estimator(data.projectionTransform);
};

const match = (data: any) => {
  const interestedTargetIndexes = data.targetIndexes;

  let matchedTargetIndex = -1;
  let matchedModelViewTransform = null;
  let matchedDebugExtra = null;

  for (let i = 0; i < interestedTargetIndexes.length; i++) {
    const matchingIndex = interestedTargetIndexes[i];

    const { keyframeIndex, screenCoords, worldCoords, debugExtra } = matcher.matchDetection(
      matchingDataList[matchingIndex],
      data.featurePoints
    );
    matchedDebugExtra = debugExtra;

    if (keyframeIndex !== -1 && screenCoords && worldCoords) {
      const modelViewTransform = estimator.estimate({ screenCoords, worldCoords });

      if (modelViewTransform) {
        matchedTargetIndex = matchingIndex;
        matchedModelViewTransform = modelViewTransform;
      }

      break;
    }
  }

  postMessage({
    type: 'matchDone',
    targetIndex: matchedTargetIndex,
    modelViewTransform: matchedModelViewTransform,
    debugExtra: matchedDebugExtra,
  });
};

const trackUpdate = (data: any) => {
  const { modelViewTransform, worldCoords, screenCoords } = data;
  const finalModelViewTransform = estimator.refineEstimate({
    initialModelViewTransform: modelViewTransform,
    worldCoords,
    screenCoords,
  });
  postMessage({
    type: 'trackUpdateDone',
    modelViewTransform: finalModelViewTransform,
  });
};

onmessage = (msg) => {
  const { data } = msg;

  switch (data.type as WorkerEvent) {
    case WORKER_EVENT.SETUP:
      setup(data);
      break;
    case WORKER_EVENT.MATCH:
      match(data);
      break;
    case WORKER_EVENT.TRACK_UPDATE:
      trackUpdate(data);
      break;
    default:
      break;
  }
};
