import { Schema } from 'aframe';
import { BaseComponent, toComponent } from 'aframe-typescript-class-components';
import { AR_COMPONENT_NAME, DEFAULT_FILTER_BETA, DEFAULT_FILTER_CUTOFF } from '../utils/constant';
import { AR_STATE, AR_ELEMENT_TAG } from '../../utils/constant';
import { IMindARFace } from './aframe';
import { MindARFaceSystem } from './face-system';

export class MindARFace extends BaseComponent<IMindARFace, MindARFaceSystem> {
  static dependencies?: string[] | undefined = [AR_COMPONENT_NAME.FACE_SYSTEM];
  static schema: Schema<IMindARFace> = {
    autoStart: { type: 'boolean', default: true },
    faceOccluder: { type: 'boolean', default: true },
    uiLoading: { type: 'string', default: 'yes' },
    uiScanning: { type: 'string', default: 'yes' },
    uiError: { type: 'string', default: 'yes' },
    filterMinCF: { type: 'number', default: -1 },
    filterBeta: { type: 'number', default: -1 },
    shouldFaceUser: { type: 'boolean', default: true },
  };

  public init() {
    if (!this.el.sceneEl) return;

    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.FACE_SYSTEM] as MindARFaceSystem;

    if (this.data.faceOccluder) {
      const faceOccluderMeshEntity = document.createElement(AR_ELEMENT_TAG.A_ENTITY);
      faceOccluderMeshEntity.setAttribute(AR_COMPONENT_NAME.DEFAULT_OCCLUDER, true);
      this.el.sceneEl.appendChild(faceOccluderMeshEntity);
    }

    arSystem.setup({
      uiLoading: this.data.uiLoading,
      uiScanning: this.data.uiScanning,
      uiError: this.data.uiError,
      filterMinCF: this.data.filterMinCF === -1 ? DEFAULT_FILTER_CUTOFF : this.data.filterMinCF,
      filterBeta: this.data.filterBeta === -1 ? DEFAULT_FILTER_BETA : this.data.filterBeta,
      shouldFaceUser: this.data.shouldFaceUser,
    });

    if (this.data.autoStart)
      this.el.sceneEl.addEventListener(AR_STATE.RENDER_START, () => {
        arSystem.start();
      });
  }
}

AFRAME.registerComponent(AR_COMPONENT_NAME.FACE, toComponent(MindARFace));
