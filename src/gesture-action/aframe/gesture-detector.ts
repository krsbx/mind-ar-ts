import { Entity } from 'aframe';
import { Helper } from '../../libs';
import { GESTURE_COMPONENT } from '../utils/constant';
import { ITouchState } from '../utils/types/aframe';

type InternalState = ITouchState | null;

AFRAME.registerComponent(GESTURE_COMPONENT.GESTURE_DETECTOR, {
  targetElement: Helper.castTo<Entity>(null),
  internalState: {
    previousState: null as InternalState,
    currentState: null as InternalState,
  },

  schema: {
    enabled: { type: 'boolean', default: true },
  },

  init: function () {
    if (!this.targetElement) this.targetElement = this.el;

    this.targetElement.addEventListener('touchstart', this.onTouch.bind(this));
    this.targetElement.addEventListener('touchend', this.onTouch.bind(this));
    this.targetElement.addEventListener('touchmove', this.onTouch.bind(this));
  },

  onTouch: function (ev: Event) {
    if (!this.data.enabled) return;

    const event = ev as TouchEvent;

    const currentState = this.getTouchState(event);
    const previousState = this.internalState.previousState;

    const havePrevCurrState = previousState && currentState;
    const haveSameTouchCount = currentState?.count == previousState?.count;

    const gestureContinues = havePrevCurrState && haveSameTouchCount;
    const gestureEnded = previousState && !gestureContinues;
    const gestureStarted = !previousState && currentState;

    if (gestureEnded) this.onTouchEnd(previousState);
    if (gestureStarted) this.onTouchStart(currentState);
    if (gestureContinues) this.onTouchMove(previousState, currentState);
  },

  onTouchStart: function (currentState: ITouchState) {
    currentState.startTime = performance.now();
    currentState.startPosition = currentState.position;
    currentState.startSpread = currentState.spread;

    const eventName = this.getEventPrefix(currentState.count) + 'fingerstart';

    this.el.emit(eventName, currentState);

    this.internalState.previousState = currentState;
  },

  onTouchEnd: function (previousState: ITouchState) {
    const eventName = this.getEventPrefix(previousState.count) + 'fingerend';

    this.el.emit(eventName, previousState);

    this.internalState.previousState = null;
  },

  onTouchMove: function (previousState: ITouchState, currentState: ITouchState) {
    const eventDetail = {
      positionChange: {
        x: currentState.position.x - previousState.position.x,

        y: currentState.position.y - previousState.position.y,
      },
      spreadChange: 0,
    };

    if (!Helper.isNil(currentState?.spread))
      eventDetail.spreadChange = currentState.spread - (previousState.spread ?? 0);

    // Update state with new data
    Object.assign(previousState, currentState);

    // Add state data to event detail
    Object.assign(eventDetail, previousState);

    const eventName = this.getEventPrefix(currentState.count) + 'fingermove';
    this.el.emit(eventName, eventDetail);
  },

  getTouchState: function (ev: TouchEvent) {
    if (ev.touches.length === 0) return null;

    const zeroPosXY = {
      x: 0,
      y: 0,
    };

    const touchState: ITouchState = {
      count: ev.touches.length,
      rawPosition: zeroPosXY,
      position: zeroPosXY,
    };

    // Get all touches on the target element.
    const touches: Touch[] = [];

    for (let i = 0; i < ev.touches.length; i++) {
      touches.push(ev.touches[i]);
    }

    // Get all raw positions from touches
    const averageRawX = touches.reduce((acc, cur) => acc + cur.clientX, 0) / touches.length;
    const averageRawY = touches.reduce((acc, curr) => acc + curr.clientY, 0) / touches.length;

    touchState.rawPosition = {
      x: averageRawX,
      y: averageRawY,
    };

    // Get the scale of touch positions
    const scale = 2 / (window.innerHeight + window.innerWidth);

    touchState.position = {
      x: averageRawX * scale,
      y: averageRawY * scale,
    };

    if (touches.length == 1) return touchState;

    // Get the spread of touch positions
    const spread =
      touches.reduce((acc, cur) => {
        const xSqr = Math.pow(averageRawX - cur.clientX, 2);
        const ySqr = Math.pow(averageRawY - cur.clientY, 2);

        return acc + Math.sqrt(xSqr + ySqr);
      }, 0) / touches.length;

    touchState.spread = spread * scale;

    return touchState;
  },

  getEventPrefix: function (touchCount: number) {
    const names = ['one', 'two', 'three', 'many'];

    return names[Math.min(touchCount, 4) - 1];
  },
});
