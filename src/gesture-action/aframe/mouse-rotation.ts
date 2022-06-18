import { Entity } from 'aframe';
import { AR_EVENT_NAME } from '../../image-target/utils/constant/aframe';
import { Helper } from '../../libs';
import { GESTURE_COMPONENT, GESTURE_EVENT_NAME } from '../utils/constant';

AFRAME.registerComponent(GESTURE_COMPONENT.MOUSE_HANDLER.ROTATION, {
  el: Helper.castTo<Entity>(null),

  schema: {
    enabled: { type: 'boolean', default: true },
    rotationFactor: { type: 'number', default: 5 },
  },

  init: function () {
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
  },

  onRotation: function (event: Event) {
    if (!this.data.enabled) return;
    if (!event.detail.positionChange) return;

    this.el.object3D.rotation.y += event.detail.positionChange.x * this.data.rotationFactor;
    this.el.object3D.rotation.x += event.detail.positionChange.y * this.data.rotationFactor;
  },
});
