/* eslint-disable @typescript-eslint/no-explicit-any */
import { AR_STATE } from '../../utils/constant';
import { AR_COMPONENT_NAME, AR_EVENT_NAME } from '../utils/constant';

AFRAME.registerComponent(AR_COMPONENT_NAME.LOCATION, {
  dependencies: [AR_COMPONENT_NAME.LOCATION_SYSTEM],

  el: null as any,

  schema: {
    showStats: { type: 'boolean', default: false },
    autoStart: { type: 'boolean', default: true },
    uiLoading: { type: 'string', default: 'yes' },
    uiScanning: { type: 'string', default: 'yes' },
    uiError: { type: 'string', default: 'yes' },
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

    arSystem.setup({
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

  tock: function () {
    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.LOCATION_SYSTEM];

    if (!arSystem) return;

    const {
      controller: { currentPosition, originPosition, computeDistanceMeters },
    } = arSystem;
    const position = this.el.getAttribute('position');

    const dstCoords = {
      longitude: currentPosition.longitude,
      latitude: originPosition.latitude,
    };

    const distance = computeDistanceMeters(originPosition, dstCoords);

    position.x = distance;
    position.x *= currentPosition.longitude > originPosition.longitude ? 1 : -1;

    position.z = distance;
    position.z *= currentPosition.latitude > originPosition.latitude ? -1 : 1;

    // Update the position of the camera
    this.el.setAttribute('position', position);

    this.el.emit(AR_EVENT_NAME.LOCATION_UPDATED, {
      position,
    });
  },
});
