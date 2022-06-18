/* eslint-disable @typescript-eslint/no-explicit-any */
import { Entity } from 'aframe';
import { AR_EVENT_NAME } from '../../image-target/utils/constant/aframe';
import { Helper } from '../../libs';
import { GESTURE_COMPONENT, GESTURE_EVENT_NAME } from '../utils/constant';

AFRAME.registerComponent(GESTURE_COMPONENT.MOUSE_HANDLER.SCALE, {
  scaleFactor: 1,
  initialScale: { x: 0, y: 0, z: 0 } as Vector3,

  el: Helper.castTo<Entity>(null),

  schema: {
    enabled: { type: 'boolean', default: true },
    minScale: { type: 'number', default: 0.3 },
    maxScale: { type: 'number', default: 8 },
  },

  init: function () {
    if (!this.el.sceneEl) return;

    this.initialScale = this.el.object3D.scale.clone();

    this.el.sceneEl.addEventListener(AR_EVENT_NAME.MARKER_FOUND, () => {
      if (!this.el.sceneEl) return;

      this.el.sceneEl.addEventListener(
        GESTURE_EVENT_NAME.SCALE_MOUSE_MOVE,
        this.onScaling.bind(this)
      );
    });

    this.el.sceneEl.addEventListener(AR_EVENT_NAME.MARKER_LOST, () => {
      if (!this.el.sceneEl) return;

      this.el.sceneEl.removeEventListener(GESTURE_EVENT_NAME.SCALE_MOUSE_MOVE, this.onScaling);
    });
  },

  onScaling: function (event: Event) {
    if (!this.data.enabled) return;
    if (!event.detail.spreadChange) return;

    const { spreadChange } = event.detail;

    this.scaleFactor *= 1 + spreadChange;

    // Clamp scale factor.
    this.scaleFactor = Math.min(this.data.maxScale, Math.max(this.data.minScale, this.scaleFactor));
    this.el.object3D.scale.set(
      this.initialScale.x * this.scaleFactor,
      this.initialScale.y * this.scaleFactor,
      this.initialScale.z * this.scaleFactor
    );
  },
});
