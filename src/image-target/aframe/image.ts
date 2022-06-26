import { Entity, SystemDefinition } from 'aframe';
import { Helper } from '../../libs';
import { AR_STATE } from '../../utils/constant';
import { AR_COMPONENT_NAME } from '../utils/constant/aframe';
import { IMindARImageSystem } from '../../../types/image-target/aframe';

AFRAME.registerComponent(AR_COMPONENT_NAME.IMAGE, {
  dependencies: [AR_COMPONENT_NAME.IMAGE_SYSTEM],

  el: Helper.castTo<Entity>(null),

  schema: {
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
    _positionSettings: { type: 'string', default: 'absolute' },
    _positionZIndex: { type: 'int', default: -2 },
  },

  init: function () {
    if (!this.el.sceneEl) return;

    const arSystem = this.el.sceneEl.systems[
      AR_COMPONENT_NAME.IMAGE_SYSTEM
    ] as SystemDefinition<IMindARImageSystem>;

    arSystem.setup({
      imageTargetSrc: this.data.imageTargetSrc,
      maxTrack: this.data.maxTrack,
      filterMinCF: this.data.filterMinCF === -1 ? null : this.data.filterMinCF,
      filterBeta: this.data.filterBeta === -1 ? null : this.data.filterBeta,
      missTolerance: this.data.missTolerance === -1 ? null : this.data.missTolerance,
      warmupTolerance: this.data.warmupTolerance === -1 ? null : this.data.warmupTolerance,
      showStats: this.data.showStats,
      uiLoading: this.data.uiLoading,
      uiScanning: this.data.uiScanning,
      uiError: this.data.uiError,
      reshowScanning: this.data.reshowScanning,
      shouldFaceUser: this.data.shouldFaceUser,
      _positionSettings: this.data._positionSettings,
      _positionZIndex: this.data._positionZIndex,
    });

    if (this.data.autoStart)
      this.el.sceneEl.addEventListener(AR_STATE.RENDER_START, () => {
        arSystem.start();
      });
  },
});
