/* eslint-disable @typescript-eslint/no-explicit-any */
import { AR_COMPONENT_NAME, AR_EVENT_NAME } from '../utils/constant';

AFRAME.registerComponent(AR_COMPONENT_NAME.LOCATION_PLACE, {
  dependencies: [AR_COMPONENT_NAME.LOCATION_SYSTEM],
  el: null as any,

  schema: {
    latitude: { type: 'number' },
    longitude: { type: 'number' },
  },

  init: function () {
    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.LOCATION_SYSTEM];
    arSystem.registerAnchor(this, {
      latitude: this.data.latitude,
      longitude: this.data.longitude,
    });

    const root = this.el.object3D;
    root.visible = false;
  },

  updateWorldMatrix: function (inVisibleRange?: boolean) {
    if (!this.el.object3D.visible) this.el.emit(AR_EVENT_NAME.LOCATION_FOUND);
    else this.el.emit(AR_EVENT_NAME.LOCATION_LOST);

    this.el.object3D.visible = !!inVisibleRange;
  },
});
