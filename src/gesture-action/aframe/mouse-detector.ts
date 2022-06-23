import { Entity, Schema } from 'aframe';
import { BaseComponent, toComponent } from 'aframe-typescript-class-components';
import { GESTURE_COMPONENT, GESTURE_EVENT_NAME, MOUSE_SCALE_STEP } from '../utils/constant';
import { IMouseState } from '../utils/types/aframe';
import { IDetector, IMouseDetector } from './aframe';

export class MindARMouseDetector extends BaseComponent<IDetector> {
  targetElement!: Entity;
  internalState!: IMouseDetector;

  static schema: Schema<IDetector> = {
    enabled: { type: 'boolean', default: true },
  };

  public init() {
    if (!this.targetElement) this.targetElement = this.el;

    this.internalState = {
      currentState: null,
      previousState: null,
      active: false,
    };

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
  }

  public onMouse(ev: Event) {
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
  }

  public onMouseStart(currentState: IMouseState) {
    currentState.startPosition = currentState.position;

    this.el.emit(GESTURE_EVENT_NAME.ROTATE_MOUSE_START, currentState);

    this.internalState.previousState = currentState;
  }

  public onMouseEnd(previousState: IMouseState) {
    this.el.emit(GESTURE_EVENT_NAME.ROTATE_MOUSE_END, previousState);

    this.internalState.previousState = null;
  }

  public onMouseMove(previousState: IMouseState, currentState: IMouseState) {
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
  }

  public getMouseState(event: MouseEvent) {
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
  }

  public onWheel(ev: Event) {
    const event = ev as WheelEvent;

    const scale = 2 / (window.innerHeight + window.innerWidth);

    const spreadChange = Math.sign(event.deltaY) * scale * MOUSE_SCALE_STEP;

    this.el.emit(GESTURE_EVENT_NAME.SCALE_MOUSE_MOVE, {
      spreadChange,
    });
  }
}

AFRAME.registerComponent(GESTURE_COMPONENT.MOUSE_DETECTOR, toComponent(MindARMouseDetector));
