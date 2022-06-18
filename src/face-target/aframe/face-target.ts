/* eslint-disable @typescript-eslint/no-explicit-any */
import { Entity } from 'aframe';
import { Helper } from '../../libs';
import { AR_COMPONENT_NAME } from '../utils/constant';
import { Matrix4Args } from '../utils/types/face-target';

AFRAME.registerComponent(AR_COMPONENT_NAME.FACE_TARGET, {
  dependencies: [AR_COMPONENT_NAME.FACE_SYSTEM],

  el: Helper.castTo<Entity>(null),

  schema: {
    anchorIndex: { type: 'number' },
  },

  init: function () {
    if (!this.el.sceneEl) return;

    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.FACE_SYSTEM] as any;
    arSystem.registerAnchor(this, this.data.anchorIndex);

    const root = this.el.object3D;
    root.visible = false;
    root.matrixAutoUpdate = false;
  },

  updateVisibility(visible: boolean) {
    this.el.object3D.visible = visible;
  },

  updateMatrix(matrix: Matrix4Args) {
    const root = this.el.object3D;
    root.matrix.set(...matrix);
  },
});
