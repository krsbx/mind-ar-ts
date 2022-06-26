import { Entity, SystemDefinition } from 'aframe';
import { BufferGeometry } from 'three';
import { AR_COMPONENT_NAME } from '../utils/constant';
import { AR_ELEMENT_TAG } from '../../utils/constant';
import { Helper } from '../../libs';
import { Matrix4Args } from '../utils/types/face-target';
import { IMindARFaceSystem } from '../../../types/face-target/aframe';

AFRAME.registerComponent(AR_COMPONENT_NAME.DEFAULT_OCCLUDER, {
  el: Helper.castTo<Entity>(null),

  init: function () {
    if (!this.el.sceneEl) return;

    const arSystem = this.el.sceneEl.systems[
      AR_COMPONENT_NAME.FACE_SYSTEM
    ] as SystemDefinition<IMindARFaceSystem>;
    arSystem.registerFaceMesh(this);

    const root = this.el.object3D;
    root.matrixAutoUpdate = false;
  },

  updateVisibility(visible: boolean) {
    this.el.object3D.visible = visible;
  },

  updateMatrix(matrix: number[] | null) {
    if (!matrix) return;

    const root = this.el.object3D;
    root.matrix.set(...Helper.castTo<Matrix4Args>(matrix));
  },

  addFaceMesh(faceGeometry: BufferGeometry) {
    const material = new AFRAME.THREE.MeshBasicMaterial({ colorWrite: false });

    const mesh = new AFRAME.THREE.Mesh(faceGeometry, material);

    this.el.setObject3D(AR_ELEMENT_TAG.MESH, mesh);
  },
});
