import { Schema } from 'aframe';
import { BaseComponent, toComponent } from 'aframe-typescript-class-components';
import { AR_COMPONENT_NAME } from '../utils/constant';
import { Matrix4Args } from '../utils/types/face-target';
import { IMindARFaceTarget } from './aframe';
import { MindARFaceSystem } from './face-system';

export class MindARFaceTarget extends BaseComponent<IMindARFaceTarget, MindARFaceSystem> {
  static dependencies?: string[] | undefined = [AR_COMPONENT_NAME.FACE_SYSTEM];
  static schema: Schema<IMindARFaceTarget> = {
    anchorIndex: { type: 'number' },
  };

  public init() {
    if (!this.el.sceneEl) return;

    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.FACE_SYSTEM] as MindARFaceSystem;
    arSystem.registerAnchor(this, this.data.anchorIndex);

    const root = this.el.object3D;
    root.visible = false;
    root.matrixAutoUpdate = false;
  }

  public updateVisibility(visible: boolean) {
    this.el.object3D.visible = visible;
  }

  public updateMatrix(matrix: Matrix4Args | null) {
    if (!matrix) return;

    const root = this.el.object3D;
    root.matrix.set(...matrix);
  }
}

AFRAME.registerComponent(AR_COMPONENT_NAME.FACE_TARGET, toComponent(MindARFaceTarget));
