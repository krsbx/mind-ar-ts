/* eslint-disable @typescript-eslint/no-explicit-any */
import { AR_COMPONENT_NAME } from '../utils/constant';

AFRAME.registerComponent(AR_COMPONENT_NAME.FACE_TARGET, {
  dependencies: [AR_COMPONENT_NAME.FACE_SYSTEM],

  el: null as any,

  schema: {
    anchorIndex: { type: 'number' },
  },

  init: function () {
    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.FACE_SYSTEM];
    arSystem.registerAnchor(this, this.data.anchorIndex);

    const root = this.el.object3D;
    root.visible = false;
    root.matrixAutoUpdate = false;
  },

  updateVisibility(visible: boolean) {
    this.el.object3D.visible = visible;
  },

  updateMatrix(matrix: number[]) {
    const root = this.el.object3D;
    root.matrix.set(...matrix);
  },
});
