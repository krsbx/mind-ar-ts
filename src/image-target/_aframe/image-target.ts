/* eslint-disable @typescript-eslint/no-explicit-any */
import { Matrix4 } from 'three';
import { Helper } from '../../libs';

AFRAME.registerComponent('mindar-image-target', {
  dependencies: ['mindar-image-system'],
  el: null as any,
  postMatrix: Helper.castTo<Matrix4>(null), // rescale the anchor to make width of 1 unit = physical width of card

  schema: {
    targetIndex: { type: 'number' },
  },

  init: function () {
    const arSystem = this.el.sceneEl.systems['mindar-image-system'];
    arSystem.registerAnchor(this, this.data.targetIndex);

    const root = this.el.object3D;
    root.visible = false;
    root.matrixAutoUpdate = false;
  },

  setupMarker([markerWidth, markerHeight]: number[]) {
    const position = new AFRAME.THREE.Vector3();
    const quaternion = new AFRAME.THREE.Quaternion();
    const scale = new AFRAME.THREE.Vector3();

    position.x = markerWidth / 2;
    position.y = markerWidth / 2 + (markerHeight - markerWidth) / 2;

    scale.x = markerWidth;
    scale.y = markerWidth;
    scale.z = markerWidth;

    this.postMatrix = new AFRAME.THREE.Matrix4();
    this.postMatrix.compose(position, quaternion, scale);
  },

  updateWorldMatrix(worldMatrix: number[] | null) {
    if (!this.el.object3D.visible && worldMatrix) this.el.emit('targetFound');
    else if (this.el.object3D.visible && !worldMatrix) this.el.emit('targetLost');

    this.el.object3D.visible = !!worldMatrix;
    if (!worldMatrix) return;

    const m = new AFRAME.THREE.Matrix4();
    m.elements = worldMatrix;

    m.multiply(this.postMatrix);
    this.el.object3D.matrix = m;
  },
});

export {};
