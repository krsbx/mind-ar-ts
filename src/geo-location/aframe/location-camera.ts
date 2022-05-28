/* eslint-disable @typescript-eslint/no-explicit-any */
import { Helper } from '../../libs';
import { AR_COMPONENT_NAME } from '../utils/constant';

AFRAME.registerComponent(AR_COMPONENT_NAME.LOCATION_CAMERA, {
  dependencies: [AR_COMPONENT_NAME.LOCATION_SYSTEM],

  arSystem: null as any,
  el: null as any,

  schema: {
    shouldFaceUser: { type: 'boolean', default: false },
    simulateLatitude: { type: 'number', default: 0 },
    simulateLongitude: { type: 'number', default: 0 },
    simulateAltitude: { type: 'number', default: 0 },
    positionMinAccuracy: { type: 'int', default: 100 },
    minDistance: { type: 'int', default: 10 },
    maxDistance: { type: 'int', default: 30 },
    gpsMinDistance: { type: 'number', default: 10 },
    gpsTimeInterval: { type: 'number', default: 3 },
  },

  init: function () {
    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.LOCATION_SYSTEM];
    this.arSystem = arSystem;

    if (!arSystem) return;

    arSystem.setupCamera({
      shouldFaceUser: this.data.shouldFaceUser,
      simulateAltitude: this.data.simulateAltitude,
      simulateLatitude: this.data.simulateLatitude,
      simulateLongitude: this.data.simulateLongitude,
      positionMinAccuracy: this.data.positionMinAccuracy,
      minDistance: this.data.minDistance,
      maxDistance: this.data.maxDistance,
      gpsMinDistance: this.data.gpsMinDistance,
      gpsTimeInterval: this.data.gpsTimeInterval,
      camera: this.el,
    });
  },

  tick: function () {
    if (!this.arSystem || !this.arSystem.controller) return;

    if (Helper.isNil(this.arSystem.controller.heading)) return;

    this.arSystem.controller.updateRotation();
  },
});
