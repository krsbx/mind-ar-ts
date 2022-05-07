/* eslint-disable @typescript-eslint/no-explicit-any */
import { AR_COMPONENT_NAME, AR_EVENT_NAME } from '..//utils/constant';
import { AR_ELEMENT_TAG } from '../../utils/constant';

AFRAME.registerComponent(AR_COMPONENT_NAME.OCCULDER, {
  el: null as any,

  init: function () {
    this.el.addEventListener(AR_EVENT_NAME.MODEL_LOADED, () => {
      this.el.getObject3D(AR_ELEMENT_TAG.MESH).traverse((o: any) => {
        if (o.isMesh) {
          const material = new AFRAME.THREE.MeshStandardMaterial({
            colorWrite: false,
          });

          o.material = material;
        }
      });
    });
  },
});
