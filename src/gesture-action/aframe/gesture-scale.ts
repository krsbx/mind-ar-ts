import { Schema } from 'aframe';
import { BaseComponent, toComponent } from 'aframe-typescript-class-components';
import { AR_EVENT_NAME } from '../../image-target/utils/constant/aframe';
import { GESTURE_COMPONENT, GESTURE_EVENT_NAME } from '../utils/constant';
import { IMouseGestureScale } from './aframe';

export class MindARGestureScale extends BaseComponent<IMouseGestureScale> {
  scaleFactor = 1;
  initialScale: Vector3 = { x: 0, y: 0, z: 0 };

  static schema: Schema<IMouseGestureScale> = {
    enabled: { type: 'boolean', default: true },
    minScale: { type: 'number', default: 0.3 },
    maxScale: { type: 'number', default: 8 },
  };

  public init() {
    if (!this.el.sceneEl) return;

    this.initialScale = this.el.object3D.scale.clone();

    this.el.sceneEl.addEventListener(AR_EVENT_NAME.MARKER_FOUND, () => {
      if (!this.el.sceneEl) return;

      this.el.sceneEl.addEventListener(
        GESTURE_EVENT_NAME.TWO_FINGER_MOVE,
        this.onScaling.bind(this)
      );
    });

    this.el.sceneEl.addEventListener(AR_EVENT_NAME.MARKER_LOST, () => {
      if (!this.el.sceneEl) return;

      this.el.sceneEl.removeEventListener(GESTURE_EVENT_NAME.TWO_FINGER_MOVE, this.onScaling);
    });
  }

  public onScaling(event: Event) {
    if (!this.data.enabled) return;
    if (!event.detail.spreadChange || !event.detail.startSpread) return;

    const { spreadChange, startSpread } = event.detail;

    this.scaleFactor *= 1 + spreadChange / startSpread;

    // Clamp scale factor.
    this.scaleFactor = Math.min(this.data.maxScale, Math.max(this.data.minScale, this.scaleFactor));
    this.el.object3D.scale.set(
      this.initialScale.x * this.scaleFactor,
      this.initialScale.y * this.scaleFactor,
      this.initialScale.z * this.scaleFactor
    );
  }
}

AFRAME.registerComponent(GESTURE_COMPONENT.GESTURE_HANDLER.SCALE, toComponent(MindARGestureScale));
