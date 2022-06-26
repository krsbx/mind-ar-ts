import { Entity, SystemDefinition } from 'aframe';
import { Matrix4 } from 'three';
import { Helper } from '../../libs';
import { AR_COMPONENT_NAME, AR_EVENT_NAME } from '../utils/constant/aframe';
import { IMindARImageSystem } from '../../../types/image-target/aframe';

AFRAME.registerComponent(AR_COMPONENT_NAME.IMAGE_TARGET, {
  dependencies: [AR_COMPONENT_NAME.IMAGE_SYSTEM],
  el: Helper.castTo<Entity>(null),
  postMatrix: Helper.castTo<Matrix4>(null), // rescale the anchor to make width of 1 unit = physical width of card

  schema: {
    targetIndex: { type: 'number' },
  },

  init: function () {
    if (!this.el.sceneEl) return;

    const arSystem = this.el.sceneEl.systems[
      AR_COMPONENT_NAME.IMAGE_SYSTEM
    ] as SystemDefinition<IMindARImageSystem>;
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

  updateWorldMatrix(worldMatrix?: number[] | null) {
    if (!this.el.object3D.visible && worldMatrix) this.el.emit(AR_EVENT_NAME.MARKER_FOUND);
    else if (this.el.object3D.visible && !worldMatrix) this.el.emit(AR_EVENT_NAME.MARKER_LOST);

    this.el.object3D.visible = !!worldMatrix;
    if (!worldMatrix) return;

    const m = new AFRAME.THREE.Matrix4();
    m.elements = worldMatrix;

    m.multiply(this.postMatrix);
    this.el.object3D.matrix = m;
  },
});
