import { Entity } from 'aframe';
import { Helper } from '../../libs';
import { GESTURE_COMPONENT, GESTURE_EVENT_NAME, MOUSE_SCALE_STEP } from '../utils/constant';
import { IMouseState } from '../utils/types/aframe';

type InternalState = IMouseState | null;

AFRAME.registerComponent(GESTURE_COMPONENT.MOUSE_DETECTOR, {
  targetElement: Helper.castTo<Entity>(null),
  internalState: {
    previousState: null as InternalState,
    currentState: null as InternalState,
    active: false,
  },

  schema: {
    enabled: { type: 'boolean', default: true },
  },

  init: function () {
    if (!this.targetElement) this.targetElement = this.el;

    this.targetElement.addEventListener('mousedown', (e) => {
      this.internalState.active = true;

      this.onMouse(e);
    });
    this.targetElement.addEventListener('mouseup', (e) => {
      this.internalState.active = false;

      this.onMouse(e);
    });
    this.targetElement.addEventListener('mousemove', this.onMouse.bind(this));

    this.targetElement.addEventListener('wheel', this.onWheel.bind(this));
  },

  onMouse: function (ev: Event) {
    if (!this.data.enabled) return;

    const event = ev as MouseEvent;

    const currentState = this.getMouseState(event);
    const previousState = this.internalState.previousState;

    const havePrevCurrState = previousState && currentState;
    const isActive = this.internalState.active;

    const gestureContinues = havePrevCurrState && isActive;
    const gestureEnded = previousState && !gestureContinues;
    const gestureStarted = !previousState && currentState;

    if (gestureEnded) this.onMouseEnd(previousState);
    if (gestureStarted) this.onMouseStart(currentState);
    if (gestureContinues) this.onMouseMove(previousState, currentState);
  },

  onMouseStart: function (currentState: IMouseState) {
    currentState.startPosition = currentState.position;

    this.el.emit(GESTURE_EVENT_NAME.ROTATE_MOUSE_START, currentState);

    this.internalState.previousState = currentState;
  },

  onMouseEnd: function (previousState: IMouseState) {
    this.el.emit(GESTURE_EVENT_NAME.ROTATE_MOUSE_END, previousState);

    this.internalState.previousState = null;
  },

  onMouseMove: function (previousState: IMouseState, currentState: IMouseState) {
    const eventDetail = {
      positionChange: {
        x: currentState.position.x - previousState.position.x,

        y: currentState.position.y - previousState.position.y,
      },
    };

    // Update state with new data
    Object.assign(previousState, currentState);

    // Add state data to event detail
    Object.assign(eventDetail, previousState);

    this.el.emit(GESTURE_EVENT_NAME.ROTATE_MOUSE_MOVE, eventDetail);
  },

  getMouseState: function (event: MouseEvent) {
    const zeroPosXY = {
      x: 0,
      y: 0,
    };

    const mouseState: IMouseState = {
      rawPosition: zeroPosXY,
      position: zeroPosXY,
    };

    mouseState.rawPosition = {
      x: event.clientX,
      y: event.clientY,
    };

    // Get the scale of touch positions
    const scale = 2 / (window.innerHeight + window.innerWidth);

    mouseState.position = {
      x: mouseState.rawPosition.x * scale,
      y: mouseState.rawPosition.y * scale,
    };

    return mouseState;
  },

  onWheel: function (ev: Event) {
    const event = ev as WheelEvent;

    const scale = 2 / (window.innerHeight + window.innerWidth);

    const spreadChange = Math.sign(event.deltaY) * scale * MOUSE_SCALE_STEP;

    this.el.emit(GESTURE_EVENT_NAME.SCALE_MOUSE_MOVE, {
      spreadChange,
    });
  },
});
