/* eslint-disable @typescript-eslint/no-explicit-any */
import { AR_COMPONENT_NAME } from '../utils/constant';

AFRAME.registerComponent(AR_COMPONENT_NAME.LOCATION_PLACE, {
  dependencies: [AR_COMPONENT_NAME.LOCATION_SYSTEM],

  arSystem: null as any,
  el: null as any,

  initialized: false,
  isAdded: false,

  schema: {
    longitude: { type: 'number', default: 0 },
    latitude: { type: 'number', default: 0 },
  },

  init: function () {
    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.LOCATION_SYSTEM];
    this.arSystem = arSystem;
  },

  // Delay the setup to avoid the place to be set up before the location system registered
  tock: function () {
    if (!this.isAdded && this.initialized) this.setup();
  },

  setup: function () {
    this.arSystem.addLocation({
      ...this.data,
      location: this.el,
    });

    this.isAdded = true;
  },
});
