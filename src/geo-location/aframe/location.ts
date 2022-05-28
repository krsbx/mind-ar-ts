/* eslint-disable @typescript-eslint/no-explicit-any */
import { AR_STATE } from '../../utils/constant';
import { AR_COMPONENT_NAME } from '../utils/constant';

AFRAME.registerComponent(AR_COMPONENT_NAME.LOCATION, {
  dependencies: [AR_COMPONENT_NAME.LOCATION_SYSTEM],

  el: null as any,

  schema: {
    showStats: { type: 'boolean', default: false },
    autoStart: { type: 'boolean', default: true },
    uiLoading: { type: 'string', default: 'yes' },
    uiScanning: { type: 'string', default: 'yes' },
    uiError: { type: 'string', default: 'yes' },
  },

  init: function () {
    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.LOCATION_SYSTEM];

    arSystem.setupSystem({
      uiLoading: this.data.uiLoading,
      uiScanning: this.data.uiScanning,
      uiError: this.data.uiError,
      showStats: this.data.showStats,
      shouldFaceUser: this.data.shouldFaceUser,
      simulateLatitude: this.data.simulateLatitude,
      simulateLongitude: this.data.simulateLongitude,
      simulateAltitude: this.data.simulateAltitude,
      positionMinAccuracy: this.data.positionMinAccuracy,
      minDistance: this.data.minDistance,
      maxDistance: this.data.maxDistance,
      gpsMinDistance: this.data.gpsMinDistance,
      gpsTimeInterval: this.data.gpsTimeInterval,
    });

    if (this.data.autoStart)
      this.el.sceneEl.addEventListener(AR_STATE.RENDER_START, () => {
        arSystem.start();
      });
  },
});
