const AR_COMPONENT_NAME = {
  LOCATION: 'mindar-location',
  LOCATION_PLACE: 'mindar-location-place',
  LOCATION_SYSTEM: 'mindar-location-system',
  LOCATION_CAMERA: 'mindar-location-camera',
};

const AR_EVENT_NAME = {
  LOCATION_FOUND: 'location-objectFound',
  LOCATION_LOST: 'location-objectLost',
  LOCATION_UPDATED: 'location-updated',
  CAMERA_ORIGIN_SET: 'location-camera-origin-set',
  LOCATION_UPDATE_POSITION: 'location-location-update-position',
  LOCATION_PLACE_ADDED: 'location-location-place-added',
};

const SYSTEM_STATE = {
  LOCATION_INITIALIZING: 'location-initializing',
  LOCATION_INITIALIZED: 'location-initialized',
  CAMERA_INITIALIZING: 'location-camera-initializing',
  CAMERA_INITIALIZED: 'location-camera-initialized',
  LOCATION_READY: 'location-ready',
  LOCATION_ERROR: 'location-error',
};

const AR_POSITION_MULTIPLIER = {
  X: 'x',
  Z: 'z',
} as const;

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const FULL_CIRCLE_DEG = 360;

const SEC2MS = 1000;
const MS2SEC = 1 / SEC2MS;

const EARTH_RADIUS = 6378137;

const ORIENTATION_EVENT_NAME = {
  DEVICE_ORIENTATION_ABSOLUTE: 'ondeviceorientationabsolute',
  DEVICE_ORIENTATION: 'ondeviceorientation',
};

export {
  AR_COMPONENT_NAME,
  AR_EVENT_NAME,
  SYSTEM_STATE,
  DEG2RAD,
  RAD2DEG,
  SEC2MS,
  MS2SEC,
  EARTH_RADIUS,
  AR_POSITION_MULTIPLIER,
  FULL_CIRCLE_DEG,
  ORIENTATION_EVENT_NAME,
};
