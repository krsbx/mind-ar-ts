import { BaseComponent, toComponent } from 'aframe-typescript-class-components';
import { AR_COMPONENT_NAME, AR_EVENT_NAME } from '../utils/constant';
import { AR_ELEMENT_TAG } from '../../utils/constant';

export class MindARFaceOccluder extends BaseComponent {
  public init() {
    this.el.addEventListener(AR_EVENT_NAME.MODEL_LOADED, this.onModelLoaded.bind(this));
    this.el.addEventListener(AR_EVENT_NAME.MODEL_ERROR, this.onModelError.bind(this));
  }

  public onModelLoaded() {
    this.el.getObject3D(AR_ELEMENT_TAG.MESH).traverse((o) => {
      if ((<THREE.Mesh>o).isMesh) {
        const material = new AFRAME.THREE.MeshStandardMaterial({
          colorWrite: false,
        });

        (<THREE.Mesh>o).material = material;
      }
    });
  }

  public onModelError() {
    console.warn('Model failed to load.');
  }
}

AFRAME.registerComponent(AR_COMPONENT_NAME.OCCULDER, toComponent(MindARFaceOccluder));
