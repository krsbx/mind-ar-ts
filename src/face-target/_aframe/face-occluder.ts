/* eslint-disable @typescript-eslint/no-explicit-any */

AFRAME.registerComponent('mindar-face-occluder', {
  el: null as any,

  init: function () {
    this.el.addEventListener('model-loaded', () => {
      this.el.getObject3D('mesh').traverse((o: any) => {
        if (o.isMesh) {
          const material = new AFRAME.THREE.MeshStandardMaterial({
            colorWrite: false,
          });

          o.material = material;
        }
      });
    });
  },
});

export {};
