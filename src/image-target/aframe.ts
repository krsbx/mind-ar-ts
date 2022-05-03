import Stats from 'stats-js';
import { AEntity } from 'aframe';
import { Matrix4 } from 'three';
import { UI } from '../ui/ui';
import { Controller } from './controller';
import { ON_UPDATE_EVENT } from './utils/constant/controller';
import { IOnUpdate } from './utils/types/controller';

const { Controller: ControllerClass, UI: UIClass } = window.MINDAR.IMAGE;

AFRAME.registerSystem('mindar-image-system', {
  container: null as unknown as HTMLDivElement,
  video: null as unknown as HTMLVideoElement,
  processingImage: false,
  anchorEntities: [] as any[],
  imageTargetSrc: '',
  maxTrack: -1,
  filterMinCF: -Infinity,
  filterBeta: Infinity,
  missTolerance: -Infinity,
  warmupTolerance: -Infinity,
  showStats: <boolean>false,
  controller: null as unknown as Controller,
  ui: null as unknown as UI,
  el: null as any,
  mainStats: null as unknown as Stats,

  init: function () {
    this.anchorEntities = [];
  },

  tick: function () {},

  setup: function ({
    imageTargetSrc,
    maxTrack,
    showStats,
    uiLoading,
    uiScanning,
    uiError,
    missTolerance,
    warmupTolerance,
    filterMinCF,
    filterBeta,
  }: {
    imageTargetSrc: string;
    maxTrack: number;
    showStats: boolean;
    uiLoading: string;
    uiScanning: string;
    uiError: string;
    missTolerance: number;
    warmupTolerance: number;
    filterMinCF: number;
    filterBeta: number;
  }) {
    this.imageTargetSrc = imageTargetSrc;
    this.maxTrack = maxTrack;
    this.filterMinCF = filterMinCF;
    this.filterBeta = filterBeta;
    this.missTolerance = missTolerance;
    this.warmupTolerance = warmupTolerance;
    this.showStats = showStats;
    this.ui = new UIClass({ uiLoading, uiScanning, uiError });
  },

  registerAnchor: function (el: any, targetIndex: number) {
    this.anchorEntities.push({ el, targetIndex });
  },

  start: function () {
    this.container = this.el.sceneEl.parentNode;

    if (this.showStats) {
      this.mainStats = new Stats() as Stats;
      this.mainStats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
      this.mainStats.domElement.style.cssText = 'position:absolute;top:0px;left:0px;z-index:999';
      this.container.appendChild(this.mainStats.domElement);
    }

    this.ui.showLoading();
    this._startVideo();
  },

  switchTarget: function (targetIndex: number) {
    this.controller.interestedTargetIndex = targetIndex;
  },

  stop: function () {
    this.pause();

    if (!this.video) return;

    const { srcObject } = this.video;

    if (!srcObject) return;

    const tracks = (srcObject as MediaStream).getTracks();

    tracks.forEach(function (track) {
      track.stop();
    });

    this.video.remove();
  },

  pause: function (keepVideo = false) {
    if (!keepVideo) {
      this.video.pause();
    }

    this.controller.stopProcessVideo();
  },

  unpause: function () {
    this.video.play();
    this.controller.processVideo(this.video);
  },

  _startVideo: async function () {
    this.video = document.createElement('video') as unknown as HTMLVideoElement;

    this.video.setAttribute('autoplay', '');
    this.video.setAttribute('muted', '');
    this.video.setAttribute('playsinline', '');
    this.video.style.position = 'absolute';
    this.video.style.top = '0px';
    this.video.style.left = '0px';
    this.video.style.zIndex = '-2';
    this.container.appendChild(this.video);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // TODO: show unsupported error
      this.el.emit('arError', { error: 'VIDEO_FAIL' });
      this.ui.showCompatibility();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'environment',
        },
      });

      this.video.addEventListener('loadedmetadata', () => {
        this.video.setAttribute('width', this.video.videoWidth.toString());
        this.video.setAttribute('height', this.video.videoHeight.toString());
        this._startAR();
      });

      this.video.srcObject = stream;
    } catch (err) {
      console.log('getUserMedia error', err);
      this.el.emit('arError', { error: 'VIDEO_FAIL' });
    }
  },

  _startAR: async function () {
    if (!this.video) return;

    this.controller = new ControllerClass({
      inputWidth: this.video.videoWidth,
      inputHeight: this.video.videoHeight,
      maxTrack: this.maxTrack,
      filterMinCF: this.filterMinCF,
      filterBeta: this.filterBeta,
      missTolerance: this.missTolerance,
      warmupTolerance: this.warmupTolerance,
      onUpdate: (data: IOnUpdate) => {
        if (data.type === ON_UPDATE_EVENT.DONE) {
          if (this.mainStats) this.mainStats.update();
        } else if (data.type === ON_UPDATE_EVENT.UPDATE_MATRIX) {
          const { targetIndex, worldMatrix } = data;

          for (let i = 0; i < this.anchorEntities.length; i++) {
            if (this.anchorEntities[i].targetIndex === targetIndex) {
              this.anchorEntities[i].el.updateWorldMatrix(worldMatrix);

              if (worldMatrix) this.ui.hideScanning();
            }
          }
        }
      },
    });

    this._resize();
    window.addEventListener('resize', this._resize.bind(this));

    const { dimensions: imageTargetDimensions } = await this.controller.addImageTargets(
      this.imageTargetSrc
    );

    for (let i = 0; i < this.anchorEntities.length; i++) {
      const { el, targetIndex } = this.anchorEntities[i];

      if (targetIndex < imageTargetDimensions.length)
        el.setupMarker(imageTargetDimensions[targetIndex]);
    }

    await this.controller.dummyRun(this.video);
    this.el.emit('arReady');
    this.ui.hideLoading();
    this.ui.showScanning();

    this.controller.processVideo(this.video);
  },

  _resize: function () {
    const { video, container, controller } = this;

    let vw: number, vh: number; // display css width, height

    const videoRatio = video.videoWidth / video.videoHeight;
    const containerRatio = container.clientWidth / container.clientHeight;

    if (videoRatio > containerRatio) {
      vh = container.clientHeight;
      vw = vh * videoRatio;
    } else {
      vw = container.clientWidth;
      vh = vw / videoRatio;
    }

    const proj = controller.getProjectionMatrix();
    const fov = (2 * Math.atan((1 / proj[5] / vh) * container.clientHeight) * 180) / Math.PI; // vertical fov
    const near = proj[14] / (proj[10] - 1.0);
    const far = proj[14] / (proj[10] + 1.0);

    const newAspect = container.clientWidth / container.clientHeight;
    const cameraEle = container.getElementsByTagName('a-camera')[0] as typeof AEntity;

    const camera = cameraEle.getObject3D('camera') as any;
    camera.fov = fov;
    camera.aspect = newAspect;
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();

    this.video.style.top = -(vh - container.clientHeight) / 2 + 'px';
    this.video.style.left = -(vw - container.clientWidth) / 2 + 'px';
    this.video.style.width = vw + 'px';
    this.video.style.height = vh + 'px';
  },
});

AFRAME.registerComponent('mindar-image', {
  dependencies: ['mindar-image-system'],

  el: null as any,

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
  },

  init: function () {
    const {
      imageTargetSrc,
      maxTrack,
      filterMinCF,
      filterBeta,
      missTolerance,
      warmupTolerance,
      showStats,
      uiLoading,
      uiScanning,
      uiError,
      autoStart,
    } = this.data;
    const arSystem = this.el.sceneEl.systems['mindar-image-system'];

    arSystem.setup({
      imageTargetSrc,
      maxTrack,
      filterMinCF: filterMinCF === -1 ? null : filterMinCF,
      filterBeta: filterBeta === -1 ? null : filterBeta,
      missTolerance: missTolerance === -1 ? null : missTolerance,
      warmupTolerance: warmupTolerance === -1 ? null : warmupTolerance,
      showStats,
      uiLoading,
      uiScanning,
      uiError,
    });

    if (autoStart)
      this.el.sceneEl.addEventListener('renderstart', () => {
        arSystem.start();
      });
  },
});

AFRAME.registerComponent('mindar-image-target', {
  dependencies: ['mindar-image-system'],
  el: null as any,
  postMatrix: new Matrix4() as Matrix4, // rescale the anchor to make width of 1 unit = physical width of card

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

  updateWorldMatrix(worldMatrix: number[]) {
    if (!this.el.object3D.visible && worldMatrix) this.el.emit('targetFound');
    else if (this.el.object3D.visible && !worldMatrix) this.el.emit('targetLost');

    this.el.object3D.visible = worldMatrix;
    if (!worldMatrix) return;

    const m = new AFRAME.THREE.Matrix4();
    m.elements = worldMatrix;

    m.multiply(this.postMatrix);
    this.el.object3D.matrix = m;
  },
});
