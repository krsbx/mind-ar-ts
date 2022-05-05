// For some mobile device, only 16bit floating point texture is supported
//   ref: https://www.tensorflow.org/js/guide/platform_environment#precision
// Empirical results shows that modelViewProjectTransform can go up beyond that, resulting in error
// We get around this by dividing the transform matrix by 1000, and then multiply back inside webgl program
const PRECISION_ADJUST = 1000;

const SEARCH_SIZE1 = 10;
const SEARCH_SIZE2 = 2;

//const TEMPLATE_SIZE = 22 // DEFAULT
const TEMPLATE_SIZE = 6;
const TEMPLATE_SD_THRESH = 5.0;
const MAX_SIM_THRESH = 0.95;

const MAX_THRESH = 0.9;
//const MIN_THRESH = 0.55;
const MIN_THRESH = 0.2;
const SD_THRESH = 8.0;
const OCCUPANCY_SIZE = (24 * 2) / 3;

const AR2_DEFAULT_TS = 6;
const AR2_DEFAULT_TS_GAP = 1;
const AR2_SEARCH_SIZE = 10;
const AR2_SEARCH_GAP = 1;
const AR2_SIM_THRESH = 0.8;

const TRACKING_KEYFRAME = 1; // 0: 256px, 1: 128px

export {
  PRECISION_ADJUST,
  SEARCH_SIZE1,
  SEARCH_SIZE2,
  TEMPLATE_SIZE,
  TEMPLATE_SD_THRESH,
  MAX_SIM_THRESH,
  MAX_THRESH,
  MIN_THRESH,
  SD_THRESH,
  OCCUPANCY_SIZE,
  AR2_DEFAULT_TS,
  AR2_DEFAULT_TS_GAP,
  AR2_SEARCH_SIZE,
  AR2_SEARCH_GAP,
  AR2_SIM_THRESH,
  TRACKING_KEYFRAME,
};
