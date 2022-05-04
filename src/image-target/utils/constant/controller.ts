const DEFAULT_FILTER_CUTOFF = 0.001; // 1Hz. time period in milliseconds
const DEFAULT_FILTER_BETA = 1000;
const DEFAULT_WARMUP_TOLERANCE = 5;
const DEFAULT_MISS_TOLERANCE = 5;

const WORKER_EVENT = {
  SETUP: 'setup',
  MATCH: 'match',
  TRACK_UPDATE: 'trackUpdate',
  MATCH_DONE: 'matchDone',
  TRACK_UPDATE_DONE: 'trackUpdateDone',
} as const;

const ON_UPDATE_EVENT = {
  UPDATE_MATRIX: 'updateMatrix',
  DONE: 'processDone',
} as const;

export {
  DEFAULT_FILTER_CUTOFF,
  DEFAULT_FILTER_BETA,
  DEFAULT_WARMUP_TOLERANCE,
  DEFAULT_MISS_TOLERANCE,
  WORKER_EVENT,
  ON_UPDATE_EVENT,
};
