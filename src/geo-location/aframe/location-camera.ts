/* eslint-disable @typescript-eslint/no-explicit-any */
import { Helper } from '../../libs';
import { AR_COMPONENT_NAME, SYSTEM_STATE } from '../utils/constant';

AFRAME.registerComponent(AR_COMPONENT_NAME.LOCATION_CAMERA, {
  dependencies: [AR_COMPONENT_NAME.LOCATION_SYSTEM],

  arSystem: null as any,
  el: null as any,

  schema: {
    shouldFaceUser: { type: 'boolean', default: false },
    simulateAltitude: { type: 'number', default: 0 },
    simulateLatitude: { type: 'number', default: 0 },
    simulateLongitude: { type: 'number', default: 0 },
    positionMinAccuracy: { type: 'int', default: 100 },
    minDistance: { type: 'int', default: 0 },
    maxDistance: { type: 'int', default: 0 },
    gpsMinDistance: { type: 'number', default: 3 },
    gpsTimeInterval: { type: 'number', default: 3 },
  },

  init: function () {
    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.LOCATION_SYSTEM];
    this.arSystem = arSystem;

    this.el.sceneEl.addEventListener(SYSTEM_STATE.LOCATION_INITIALIZED, this.setup.bind(this));
  },

  tick: function () {
    if (!this.arSystem || !this.arSystem.controller) return;

    if (Helper.isNil(this.arSystem.controller.camera.heading === null)) return;

    this.arSystem.controller.updateRotation();
  },

  setup: function () {
    this.arSystem.setupCamera({
      ...this.data,
      camera: this.el,
    });

    console.log('Location camera initialized');

    this.el.sceneEl.removeEventListener(SYSTEM_STATE.LOCATION_INITIALIZED, this.setup);
  },
});
