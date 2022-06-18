/* eslint-disable @typescript-eslint/no-explicit-any */
import { Entity } from 'aframe';
import { AR_COMPONENT_NAME } from '../utils/constant';
import { AR_STATE, AR_ELEMENT_TAG } from '../../utils/constant';
import { Helper } from '../../libs';

AFRAME.registerComponent(AR_COMPONENT_NAME.FACE, {
  dependencies: [AR_COMPONENT_NAME.FACE_SYSTEM],

  el: Helper.castTo<Entity>(null),

  schema: {
    autoStart: { type: 'boolean', default: true },
    faceOccluder: { type: 'boolean', default: true },
    uiLoading: { type: 'string', default: 'yes' },
    uiScanning: { type: 'string', default: 'yes' },
    uiError: { type: 'string', default: 'yes' },
    filterMinCF: { type: 'number', default: -1 },
    filterBeta: { type: 'number', default: -1 },
    shouldFaceUser: { type: 'boolean', default: true },
  },

  init: function () {
    if (!this.el.sceneEl) return;

    const arSystem = this.el.sceneEl.systems[AR_COMPONENT_NAME.FACE_SYSTEM] as any;

    if (this.data.faceOccluder) {
      const faceOccluderMeshEntity = document.createElement(AR_ELEMENT_TAG.A_ENTITY);
      faceOccluderMeshEntity.setAttribute(AR_COMPONENT_NAME.DEFAULT_OCCLUDER, true);
      this.el.sceneEl.appendChild(faceOccluderMeshEntity);
    }

    arSystem.setup({
      uiLoading: this.data.uiLoading,
      uiScanning: this.data.uiScanning,
      uiError: this.data.uiError,
      filterMinCF: this.data.filterMinCF === -1 ? null : this.data.filterMinCF,
      filterBeta: this.data.filterBeta === -1 ? null : this.data.filterBeta,
      shouldFaceUser: this.data.shouldFaceUser,
    });

    if (this.data.autoStart)
      this.el.sceneEl.addEventListener(AR_STATE.RENDER_START, () => {
        arSystem.start();
      });
  },
});
