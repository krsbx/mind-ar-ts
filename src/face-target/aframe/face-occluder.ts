import { Entity } from 'aframe';
import { AR_COMPONENT_NAME, AR_EVENT_NAME } from '../utils/constant';
import { AR_ELEMENT_TAG } from '../../utils/constant';
import { Helper } from '../../libs';

AFRAME.registerComponent(AR_COMPONENT_NAME.OCCULDER, {
  el: Helper.castTo<Entity>(null),

  init: function () {
    this.el.addEventListener(AR_EVENT_NAME.MODEL_LOADED, this.onModelLoaded.bind(this));
    this.el.addEventListener(AR_EVENT_NAME.MODEL_ERROR, this.onModelError.bind(this));
  },

  onModelLoaded: function () {
    this.el.getObject3D(AR_ELEMENT_TAG.MESH).traverse((o) => {
      if ((<THREE.Mesh>o).isMesh) {
        const material = new AFRAME.THREE.MeshStandardMaterial({
          colorWrite: false,
        });

        (<THREE.Mesh>o).material = material;
      }
    });
  },

  onModelError: function () {
    console.warn('Model failed to load.');
  },
});
