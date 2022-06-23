import { Matrix4 } from 'three';
import { Schema } from 'aframe';
import { BaseComponent, toComponent } from 'aframe-typescript-class-components';
import { IMindARImageTarget } from './aframe';
import { MindARImageSystem } from './image-system';
import { AR_COMPONENT_NAME, AR_EVENT_NAME } from '../utils/constant/aframe';

export class MindARImageTarget extends BaseComponent<IMindARImageTarget, MindARImageSystem> {
  static dependencies?: string[] | undefined = [AR_COMPONENT_NAME.IMAGE_SYSTEM];
  static schema: Schema<IMindARImageTarget> = {
    targetIndex: { type: 'number' },
  };

  postMatrix!: Matrix4;

  public init() {
    if (!this.el.sceneEl) return;

    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.IMAGE_SYSTEM] as MindARImageSystem;
    arSystem.registerAnchor(this, this.data.targetIndex);

    const root = this.el.object3D;
    root.visible = false;
    root.matrixAutoUpdate = false;
  }

  public setupMarker([markerWidth, markerHeight]: number[]) {
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
  }

  public updateWorldMatrix(worldMatrix?: number[] | null) {
    if (!this.el.object3D.visible && worldMatrix) this.el.emit(AR_EVENT_NAME.MARKER_FOUND);
    else if (this.el.object3D.visible && !worldMatrix) this.el.emit(AR_EVENT_NAME.MARKER_LOST);

    this.el.object3D.visible = !!worldMatrix;
    if (!worldMatrix) return;

    const m = new AFRAME.THREE.Matrix4();
    m.elements = worldMatrix;

    m.multiply(this.postMatrix);
    this.el.object3D.matrix = m;
  }
}

AFRAME.registerComponent(AR_COMPONENT_NAME.IMAGE_TARGET, toComponent(MindARImageTarget));
