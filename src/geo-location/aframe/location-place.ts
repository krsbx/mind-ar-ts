/* eslint-disable @typescript-eslint/no-explicit-any */
import { AR_COMPONENT_NAME, AR_EVENT_NAME, SYSTEM_STATE } from '../utils/constant';

AFRAME.registerComponent(AR_COMPONENT_NAME.LOCATION_PLACE, {
  dependencies: [AR_COMPONENT_NAME.LOCATION_SYSTEM],

  el: null as any,

  schema: {
    longitude: { type: 'number', default: 0 },
    latitude: { type: 'number', default: 0 },
    placeIndex: { type: 'number' },
    minDistance: { type: 'number', default: -1 },
    maxDistance: { type: 'number', default: -1 },
  },

  init: function () {
    // Clamp minDistance and maxDistance
    this.data.minDistance = Math.max(-1, this.data.minDistance);
    this.data.maxDistance = Math.max(-1, this.data.maxDistance);

    // Trigger the event only after the camera is initialized
    this.el.sceneEl.addEventListener(SYSTEM_STATE.CAMERA_INITIALIZED, this.setup.bind(this));
    this.el.sceneEl.addEventListener(AR_EVENT_NAME.LOCATION_FOUND, this.onLocationFound.bind(this));
    this.el.sceneEl.addEventListener(AR_EVENT_NAME.LOCATION_LOST, this.onLocationLost.bind(this));
  },

  setup: function () {
    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.LOCATION_SYSTEM];
    arSystem.addLocation({
      ...this.data,
      location: this.el,
    });

    console.log('Location place added');

    this.el.sceneEl.removeEventListener(SYSTEM_STATE.CAMERA_INITIALIZED, this.setup);
  },

  onLocationFound: function (event: Event) {
    if (event.detail.placeIndex !== this.data.placeIndex) return;
    console.log(event.detail);
  },

  onLocationLost: function (event: Event) {
    if (event.detail.placeIndex !== this.data.placeIndex) return;
    console.log(event.detail);
  },
});
