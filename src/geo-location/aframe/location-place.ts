/* eslint-disable @typescript-eslint/no-explicit-any */
import { AR_COMPONENT_NAME, SYSTEM_STATE } from '../utils/constant';

AFRAME.registerComponent(AR_COMPONENT_NAME.LOCATION_PLACE, {
  dependencies: [AR_COMPONENT_NAME.LOCATION_SYSTEM],

  el: null as any,

  schema: {
    longitude: { type: 'number', default: 0 },
    latitude: { type: 'number', default: 0 },
  },

  init: function () {
    this.el.sceneEl.addEventListener(SYSTEM_STATE.LOCATION_INITIALIZED, () => {
      this.setup();
    });
  },

  setup: function () {
    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.LOCATION_SYSTEM];
    arSystem.addLocation({
      ...this.data,
      location: this.el,
    });

    console.log('Location place added');

    this.el.sceneEl.removeEventListener(SYSTEM_STATE.LOCATION_INITIALIZED, this.setup);
  },
});
