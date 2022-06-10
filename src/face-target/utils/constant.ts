export const DEFAULT_FILTER_CUTOFF = 0.001; // 1Hz. time period in milliseconds
export const DEFAULT_FILTER_BETA = 1;

export const AR_COMPONENT_NAME = {
  FACE: 'mindar-face',
  FACE_TARGET: 'mindar-face-target',
  FACE_SYSTEM: 'mindar-face-system',
  DEFAULT_OCCLUDER: 'mindar-face-default-face-occluder',
  OCCULDER: 'mindar-face-occluder',
};

export const AR_EVENT_NAME = {
  MODEL_LOADED: 'model-loaded',
  MODEL_ERROR: 'model-error',
  TARGET_FOUND: 'face-targetFound',
  TARGET_LOST: 'face-targetLost',
};
