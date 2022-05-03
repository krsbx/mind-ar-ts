const TRACKING_THRESH = 5.0; // default
const K2_FACTOR = 4.0; // Question: should it be relative to the size of the screen instead of hardcoded?
const ICP_MAX_LOOP = 10;
const ICP_BREAK_LOOP_ERROR_THRESH = 0.1;
const ICP_BREAK_LOOP_ERROR_RATIO_THRESH = 0.99;
const ICP_BREAK_LOOP_ERROR_THRESH2 = 4.0;

export {
  TRACKING_THRESH,
  K2_FACTOR,
  ICP_MAX_LOOP,
  ICP_BREAK_LOOP_ERROR_THRESH,
  ICP_BREAK_LOOP_ERROR_RATIO_THRESH,
  ICP_BREAK_LOOP_ERROR_THRESH2,
};
