import Matcher from './matching/matcher';
import Estimator from './estimation/estimator';
import { IControllerWorker, WorkerEvent } from './utils/types/controller';
import { WORKER_EVENT } from './utils/constant/controller';
import { IKeyFrame } from './utils/types/compiler';

let matchingDataList: IKeyFrame[][] = [];
let debugMode = false;
let matcher: Matcher;
let estimator: Estimator;

const setup = (data: IControllerWorker['SETUP']) => {
  matchingDataList = data.matchingDataList;
  debugMode = data.debugMode;
  matcher = new Matcher(data.inputWidth, data.inputHeight, debugMode);
  estimator = new Estimator(data.projectionTransform);
};

const match = (data: IControllerWorker['MATCH']) => {
  const interestedTargetIndexes = data.targetIndexes;

  let matchedTargetIndex = -1;
  let matchedModelViewTransform = null;
  let matchedDebugExtra = null;

  for (const matchingIndex of interestedTargetIndexes) {
    const { keyframeIndex, screenCoords, worldCoords, debugExtra } = matcher.matchDetection(
      matchingDataList[matchingIndex],
      data.featurePoints
    );

    matchedDebugExtra = debugExtra;

    if (keyframeIndex !== -1) {
      const modelViewTransform = estimator.estimate({
        screenCoords: screenCoords as Vector2[],
        worldCoords: worldCoords as Vector3[],
      });

      if (modelViewTransform) {
        matchedTargetIndex = matchingIndex;
        matchedModelViewTransform = modelViewTransform;
      }

      break;
    }
  }

  postMessage({
    type: WORKER_EVENT.MATCH_DONE,
    targetIndex: matchedTargetIndex,
    modelViewTransform: matchedModelViewTransform,
    debugExtra: matchedDebugExtra,
  });
};

const trackUpdate = (data: IControllerWorker['TRACK_UPDATE']) => {
  const { modelViewTransform: initialModelViewTransform, worldCoords, screenCoords } = data;
  const finalModelViewTransform = estimator.refineEstimate({
    initialModelViewTransform,
    screenCoords,
    worldCoords,
  });

  postMessage({
    type: WORKER_EVENT.TRACK_UPDATE_DONE,
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
  }
};

export default {} as typeof Worker & (new () => Worker);
