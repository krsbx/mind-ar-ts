import { DEG2RAD, MS2SEC, RAD2DEG, SEC2MS } from './constant';

const degToRad = (deg: number) => deg * DEG2RAD;

const radToDeg = (rad: number) => rad * RAD2DEG;

const secToMs = (sec: number) => sec * SEC2MS;

const msToSec = (ms: number) => ms * MS2SEC;

export { degToRad, radToDeg, secToMs, msToSec };
