/* eslint-disable @typescript-eslint/no-explicit-any */
import { BufferGeometry } from 'three';

AFRAME.registerComponent('mindar-face-default-face-occluder', {
  el: null as any,

  init: function () {
    const arSystem = this.el.sceneEl.systems['mindar-face-system'];
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
    //const material = new AFRAME.THREE.MeshBasicMaterial({colorWrite: '#CCCCCC'});

    const mesh = new AFRAME.THREE.Mesh(faceGeometry, material);

    this.el.setObject3D('mesh', mesh);
  },
});

export {};
