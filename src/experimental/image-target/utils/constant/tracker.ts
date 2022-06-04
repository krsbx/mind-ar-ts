export const SEARCH_SIZE1 = 10;
export const SEARCH_SIZE2 = 2;

export const TEMPLATE_SIZE = 6;
export const TEMPLATE_SD_THRESH = 5.0;
export const MAX_SIM_THRESH = 0.95;

export const MAX_THRESH = 0.9;
export const MIN_THRESH = 0.2;
export const SD_THRESH = 8.0;
export const OCCUPANCY_SIZE = (24 * 2) / 3;

export const AR2_DEFAULT_TS = 6;
export const AR2_DEFAULT_TS_GAP = 1;
export const AR2_SEARCH_SIZE = 10;
export const AR2_SEARCH_GAP = 1;
export const AR2_SIM_THRESH = 0.8;

export const TRACKING_FRAME_SIZE = {
  FULL_SIZE_256: 0,
  HALF_SIZE_128: 1,
};

export const TRACKING_KEYFRAME = TRACKING_FRAME_SIZE.FULL_SIZE_256; // 0: 256px, 1: 128px

// For some mobile device, only 16bit floating point texture is supported
//   ref: https://www.tensorflow.org/js/guide/platform_environment#precision
// Empirical results shows that modelViewProjectTransform can go up beyond that, resulting in error
// We get around this by dividing the transform matrix by 1000, and then multiply back inside webgl program
export const PRECISION_ADJUST = 1000;
