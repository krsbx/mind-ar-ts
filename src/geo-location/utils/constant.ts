const AR_COMPONENT_NAME = {
  LOCATION: 'mindar-location',
  LOCATION_PLACE: 'mindar-location-place',
  LOCATION_SYSTEM: 'mindar-location-system',
};

const AR_EVENT_NAME = {
  LOCATION_FOUND: 'location-objectFound',
  LOCATION_LOST: 'location-objectLost',
  LOCATION_UPDATED: 'location-updated',
};

const SYSTEM_STATE = {
  LOCATION_INITIALIZING: 'location-initializing',
  LOCATION_READY: 'location-ready',
  LOCATION_ERROR: 'location-error',
};

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

const SEC2MS = 1000;
const MS2SEC = 1 / SEC2MS;

const EARTH_RADIUS = 6378137;

export {
  AR_COMPONENT_NAME,
  AR_EVENT_NAME,
  SYSTEM_STATE,
  DEG2RAD,
  RAD2DEG,
  SEC2MS,
  MS2SEC,
  EARTH_RADIUS,
};
