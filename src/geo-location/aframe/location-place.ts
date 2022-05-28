/* eslint-disable @typescript-eslint/no-explicit-any */
import { AR_COMPONENT_NAME } from '../utils/constant';

AFRAME.registerComponent(AR_COMPONENT_NAME.LOCATION_PLACE, {
  dependencies: [AR_COMPONENT_NAME.LOCATION_SYSTEM],

  el: null as any,

  schema: {
    longitude: { type: 'number', default: 0 },
    latitude: { type: 'number', default: 0 },
  },

  init: function () {},
});
