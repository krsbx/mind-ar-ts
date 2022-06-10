export const DEFAULT_FILTER_CUTOFF = 0.001; // 1Hz. time period in milliseconds
export const DEFAULT_FILTER_BETA = 1000;
export const DEFAULT_WARMUP_TOLERANCE = 5;
export const DEFAULT_MISS_TOLERANCE = 5;

export const WORKER_EVENT = {
  SETUP: 'setup',
  MATCH: 'match',
  TRACK_UPDATE: 'trackUpdate',
  MATCH_DONE: 'matchDone',
  TRACK_UPDATE_DONE: 'trackUpdateDone',
} as const;

export const ON_UPDATE_EVENT = {
  UPDATE_MATRIX: 'updateMatrix',
  DONE: 'processDone',
} as const;
