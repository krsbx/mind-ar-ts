import { DEG2RAD, MS2SEC, ORIENTATION_EVENT_NAME, RAD2DEG, SEC2MS } from './constant';

const degToRad = (deg: number) => deg * DEG2RAD;

const radToDeg = (rad: number) => rad * RAD2DEG;

const secToMs = (sec: number) => sec * SEC2MS;

const msToSec = (ms: number) => ms * MS2SEC;

const getDeviceOrientationEventName = (): string => {
  let eventName = '';

  if (ORIENTATION_EVENT_NAME.DEVICE_ORIENTATION in window)
    eventName = ORIENTATION_EVENT_NAME.DEVICE_ORIENTATION;
  if (ORIENTATION_EVENT_NAME.DEVICE_ORIENTATION_ABSOLUTE in window)
    eventName = ORIENTATION_EVENT_NAME.DEVICE_ORIENTATION_ABSOLUTE;

  return eventName;
};

export { degToRad, radToDeg, secToMs, msToSec, getDeviceOrientationEventName };
