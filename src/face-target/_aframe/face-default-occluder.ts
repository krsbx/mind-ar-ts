/* eslint-disable @typescript-eslint/no-explicit-any */
import { BufferGeometry } from 'three';
import { AR_COMPONENT_NAME } from '../utils/constant';
import { AR_ELEMENT_TAG } from '../../utils/constant';

AFRAME.registerComponent(AR_COMPONENT_NAME.DEFAULT_OCCLUDER, {
  el: null as any,

  init: function () {
    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.FACE_SYSTEM];
    arSystem.registerFaceMesh(this);

    const root = this.el.object3D;
    root.matrixAutoUpdate = false;
  },

  updateVisibility(visible: boolean) {
    this.el.object3D.visible = visible;
  },

  updateMatrix(matrix: number[]) {
    const root = this.el.object3D;
    root.matrix.set(...matrix);
  },

  addFaceMesh(faceGeometry: BufferGeometry) {
    const material = new AFRAME.THREE.MeshBasicMaterial({ colorWrite: false });

    const mesh = new AFRAME.THREE.Mesh(faceGeometry, material);

    this.el.setObject3D(AR_ELEMENT_TAG.MESH, mesh);
  },
});
