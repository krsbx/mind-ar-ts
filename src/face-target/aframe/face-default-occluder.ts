import { BaseComponent, toComponent } from 'aframe-typescript-class-components';
import { AR_COMPONENT_NAME } from '../utils/constant';
import { AR_ELEMENT_TAG } from '../../utils/constant';
import { Matrix4Args } from '../utils/types/face-target';
import { MindARFaceSystem } from './face-system';

export class MindARFaceDefaultOccluder extends BaseComponent {
  public init() {
    if (!this.el.sceneEl) return;

    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.FACE_SYSTEM] as MindARFaceSystem;
    arSystem.registerFaceMesh(this);

    const root = this.el.object3D;
    root.matrixAutoUpdate = false;
  }

  public updateVisibility(visible: boolean) {
    this.el.object3D.visible = visible;
  }

  public updateMatrix(matrix: Matrix4Args) {
    const root = this.el.object3D;
    root.matrix.set(...matrix);
  }

  public addFaceMesh(faceGeometry: THREE.BufferGeometry) {
    const material = new AFRAME.THREE.MeshBasicMaterial({ colorWrite: false });

    const mesh = new AFRAME.THREE.Mesh(faceGeometry, material);

    this.el.setObject3D(AR_ELEMENT_TAG.MESH, mesh);
  }
}

AFRAME.registerComponent(
  AR_COMPONENT_NAME.DEFAULT_OCCLUDER,
  toComponent(MindARFaceDefaultOccluder)
);
