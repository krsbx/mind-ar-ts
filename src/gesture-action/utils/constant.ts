export const GESTURE_COMPONENT = {
  GESTURE_DETECTOR: 'gesture-detector',
  GESTURE_HANDLER: {
    ROTATION: 'gesture-rotation',
    SCALE: 'gesture-scale',
  },
  MOUSE_DETECTOR: 'mouse-detector',
  MOUSE_HANDLER: {
    ROTATION: 'mouse-rotation',
    SCALE: 'mouse-scale',
  },
};

export const GESTURE_EVENT_NAME = {
  ONE_FINGER_START: 'onefingerstart',
  ONE_FINGER_MOVE: 'onefingermove',
  ONE_FINGER_END: 'onefingerend',

  TWO_FINGER_START: 'twofingerstart',
  TWO_FINGER_MOVE: 'twofingermove',
  TWO_FINGER_END: 'twofingerend',

  THREE_FINGER_START: 'threefingerstart',
  THREE_FINGER_MOVE: 'threefingermove',
  THREE_FINGER_END: 'threefingerend',

  MANY_FINGER_START: 'manyfingerstart',
  MANY_FINGER_MOVE: 'manyfingermove',
  MANY_FINGER_END: 'manyfingerend',

  ROTATE_MOUSE_START: 'rotatemousestart',
  ROTATE_MOUSE_MOVE: 'rotatemousemove',
  ROTATE_MOUSE_END: 'rotatemouseend',

  SCALE_MOUSE_START: 'scalemousestart',
  SCALE_MOUSE_MOVE: 'scalemousemove',
  SCALE_MOUSE_END: 'scalemouseend',
};

export const MOUSE_SCALE_STEP = 10;
