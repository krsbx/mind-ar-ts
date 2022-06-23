import { Schema } from 'aframe';
import { BaseComponent, toComponent } from 'aframe-typescript-class-components';
import { IMindARImage } from './aframe';
import { MindARImageSystem } from './image-system';
import { AR_STATE } from '../../utils/constant';
import { AR_COMPONENT_NAME } from '../utils/constant/aframe';
import {
  DEFAULT_FILTER_BETA,
  DEFAULT_FILTER_CUTOFF,
  DEFAULT_MISS_TOLERANCE,
  DEFAULT_WARMUP_TOLERANCE,
} from '../utils/constant/controller';

export class MindARImage extends BaseComponent<IMindARImage, MindARImageSystem> {
  static dependencies?: string[] | undefined = [AR_COMPONENT_NAME.IMAGE_SYSTEM];
  static schema: Schema<IMindARImage> = {
    imageTargetSrc: { type: 'string' },
    maxTrack: { type: 'int', default: 1 },
    filterMinCF: { type: 'number', default: -1 },
    filterBeta: { type: 'number', default: -1 },
    missTolerance: { type: 'int', default: -1 },
    warmupTolerance: { type: 'int', default: -1 },
    showStats: { type: 'boolean', default: false },
    autoStart: { type: 'boolean', default: true },
    uiLoading: { type: 'string', default: 'yes' },
    uiScanning: { type: 'string', default: 'yes' },
    uiError: { type: 'string', default: 'yes' },
    reshowScanning: { type: 'boolean', default: true },
    shouldFaceUser: { type: 'boolean', default: false },
  };

  public init() {
    if (!this.el.sceneEl) return;

    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.IMAGE_SYSTEM] as MindARImageSystem;

    arSystem.setup({
      imageTargetSrc: this.data.imageTargetSrc,
      maxTrack: this.data.maxTrack,
      filterMinCF: this.data.filterMinCF === -1 ? DEFAULT_FILTER_CUTOFF : this.data.filterMinCF,
      filterBeta: this.data.filterBeta === -1 ? DEFAULT_FILTER_BETA : this.data.filterBeta,
      missTolerance:
        this.data.missTolerance === -1 ? DEFAULT_MISS_TOLERANCE : this.data.missTolerance,
      warmupTolerance:
        this.data.warmupTolerance === -1 ? DEFAULT_WARMUP_TOLERANCE : this.data.warmupTolerance,
      showStats: this.data.showStats,
      uiLoading: this.data.uiLoading,
      uiScanning: this.data.uiScanning,
      uiError: this.data.uiError,
      reshowScanning: this.data.reshowScanning,
      shouldFaceUser: this.data.shouldFaceUser,
    });

    if (this.data.autoStart)
      this.el.sceneEl.addEventListener(AR_STATE.RENDER_START, () => {
        arSystem.start();
      });
  }
}

AFRAME.registerComponent(AR_COMPONENT_NAME.IMAGE, toComponent(MindARImage));
