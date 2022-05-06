/* eslint-disable @typescript-eslint/no-explicit-any */

AFRAME.registerComponent('mindar-face-target', {
  dependencies: ['mindar-face-system'],

  el: null as any,

  schema: {
    anchorIndex: { type: 'number' },
  },

  init: function () {
    const arSystem = this.el.sceneEl.systems['mindar-face-system'];
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

export {};
