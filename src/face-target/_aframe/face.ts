/* eslint-disable @typescript-eslint/no-explicit-any */

AFRAME.registerComponent('mindar-face', {
  dependencies: ['mindar-face-system'],

  el: null as any,

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
    const arSystem = this.el.sceneEl.systems['mindar-face-system'];

    if (this.data.faceOccluder) {
      const faceOccluderMeshEntity = document.createElement('a-entity');
      faceOccluderMeshEntity.setAttribute('mindar-face-default-face-occluder', true);
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
      this.el.sceneEl.addEventListener('renderstart', () => {
        arSystem.start();
      });
  },
});

export {};
