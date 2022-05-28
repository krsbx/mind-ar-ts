/* eslint-disable @typescript-eslint/no-explicit-any */
import { Helper } from '../../libs';
import { AR_COMPONENT_NAME } from '../utils/constant';

AFRAME.registerComponent(AR_COMPONENT_NAME.LOCATION_CAMERA, {
  dependencies: [AR_COMPONENT_NAME.LOCATION_SYSTEM],

  arSystem: null as any,
  el: null as any,

  initialized: false,
  isAdded: false,

  schema: {
    shouldFaceUser: { type: 'boolean', default: false },
    simulateAltitude: { type: 'number', default: 0 },
    simulateLatitude: { type: 'number', default: 0 },
    simulateLongitude: { type: 'number', default: 0 },
    positionMinAccuracy: { type: 'int', default: 100 },
    minDistance: { type: 'int', default: 10 },
    maxDistance: { type: 'int', default: 30 },
    gpsMinDistance: { type: 'number', default: 10 },
    gpsTimeInterval: { type: 'number', default: 3 },
  },

  init: function () {
    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.LOCATION_SYSTEM];
    this.arSystem = arSystem;
  },

  tick: function () {
    if (!this.arSystem || !this.arSystem.controller) return;

    if (Helper.isNil(this.arSystem.controller.heading)) return;

    this.arSystem.controller.updateRotation();
  },

  // Delay the setup to avoid the camera to be set up before the location system registered
  tock: function () {
    if (!this.isAdded && this.initialized) this.setup();
  },

  setup: function () {
    this.arSystem.setupCamera({
      ...this.data,
      camera: this.el,
    });

    this.isAdded = true;
  },
});
