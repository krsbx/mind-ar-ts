const STATS_STYLE = 'position: absolute; top: 0px; left: 0px; z-index: 999';

const GLOBAL_AR_EVENT_NAME = {
  SCREEN_RESIZE: 'resize',
  LOADED_METADATA: 'loadedmetadata',
};

const AR_ELEMENT_TAG = {
  A_CAMERA: 'a-camera',
  A_ENTITY: 'a-entity',
  A_SCENE: 'a-scene',
  CAMERA: 'camera',
  MESH: 'mesh',
};

const AR_STATE = {
  RENDER_START: 'renderstart',
  AR_ERROR: 'arError',
  AR_READY: 'arReady',
};

const CONFIRMATION = {
  YES: 'yes',
  NO: 'no',
};

const HIDDEN_CLASS_NAME = 'hidden';

const PRODUCTION = 'production';

const IS_PRODUCTION =
  import.meta.env?.VITE_ENV === PRODUCTION ?? process.env?.NODE_ENV === PRODUCTION;

export {
  STATS_STYLE,
  GLOBAL_AR_EVENT_NAME,
  AR_ELEMENT_TAG,
  AR_STATE,
  CONFIRMATION,
  HIDDEN_CLASS_NAME,
  IS_PRODUCTION,
};
