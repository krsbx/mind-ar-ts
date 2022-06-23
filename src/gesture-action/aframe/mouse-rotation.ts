import { Schema } from 'aframe';
import { BaseComponent, toComponent } from 'aframe-typescript-class-components';
import { AR_EVENT_NAME } from '../../image-target/utils/constant/aframe';
import { GESTURE_COMPONENT, GESTURE_EVENT_NAME } from '../utils/constant';
import { IMouseGestureRotation } from './aframe';

export class MindARMouseRotation extends BaseComponent<IMouseGestureRotation> {
  static schema: Schema<IMouseGestureRotation> = {
    enabled: { type: 'boolean', default: true },
    rotationFactor: { type: 'number', default: 5 },
  };

  public init() {
    if (!this.el.sceneEl) return;

    this.el.sceneEl.addEventListener(AR_EVENT_NAME.MARKER_FOUND, () => {
      if (!this.el.sceneEl) return;

      this.el.sceneEl.addEventListener(
        GESTURE_EVENT_NAME.ROTATE_MOUSE_MOVE,
        this.onRotation.bind(this)
      );
    });

    this.el.sceneEl.addEventListener(AR_EVENT_NAME.MARKER_LOST, () => {
      if (!this.el.sceneEl) return;

      this.el.sceneEl.removeEventListener(GESTURE_EVENT_NAME.ROTATE_MOUSE_MOVE, this.onRotation);
    });
  }

  public onRotation(event: Event) {
    if (!this.data.enabled) return;
    if (!event.detail.positionChange) return;

    this.el.object3D.rotation.y += event.detail.positionChange.x * this.data.rotationFactor;
    this.el.object3D.rotation.x += event.detail.positionChange.y * this.data.rotationFactor;
  }
}

AFRAME.registerComponent(
  GESTURE_COMPONENT.MOUSE_HANDLER.ROTATION,
  toComponent(MindARMouseRotation)
);
