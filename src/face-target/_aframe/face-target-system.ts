/* eslint-disable @typescript-eslint/no-explicit-any */
import { AScene } from 'aframe';
import { UI } from '../../ui/ui';
import { Controller } from '../controller';
import { Helper } from '../../libs';

const { Controller: ControllerClass, UI: UIClass } = window.MINDAR.FACE;

AFRAME.registerSystem('mindar-face-system', {
  container: Helper.castTo<HTMLDivElement>(null),
  video: Helper.castTo<HTMLVideoElement>(null),
  anchorEntities: [] as any[],
  faceMeshEntities: [] as any[],
  filterMinCF: -Infinity,
  filterBeta: Infinity,
  controller: Helper.castTo<Controller>(null),
  ui: Helper.castTo<UI>(null),
  el: null as any,
  shouldFaceUser: <boolean>true,
  lastHasFace: <boolean>false,

  init: function () {
    this.anchorEntities = [];
    this.faceMeshEntities = [];
  },

  setup: function ({
    uiLoading,
    uiScanning,
    uiError,
    filterMinCF,
    filterBeta,
    shouldFaceUser,
  }: {
    uiLoading: string;
    uiScanning: string;
    uiError: string;
    filterMinCF: number;
    filterBeta: number;
    shouldFaceUser?: boolean;
  }) {
    this.ui = new UIClass({ uiLoading, uiScanning, uiError });
    this.filterMinCF = filterMinCF;
    this.filterBeta = filterBeta;

    if (shouldFaceUser !== undefined) this.shouldFaceUser = shouldFaceUser;
  },

  registerFaceMesh: function (el: any) {
    this.faceMeshEntities.push({ el });
  },

  registerAnchor: function (el: any, targetIndex: number) {
    this.anchorEntities.push({ el, targetIndex });
  },

  start: function () {
    this.ui.showLoading();

    this.container = this.el.sceneEl.parentNode;

    this._startVideo();
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

  switchCamera: function () {
    this.shouldFaceUser = !this.shouldFaceUser;

    this.stop();
    this.start();
  },

  pause: function (keepVideo = false) {
    if (!keepVideo) this.video.pause();

    this.controller.stopProcessVideo();
  },

  unpause: function () {
    this.video.play();
    this.controller.processVideo(this.video);
  },

  _startVideo: async function () {
    this.video = Helper.castTo<HTMLVideoElement>(document.createElement('video'));

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
      const DEVICES = await navigator.mediaDevices.enumerateDevices();
      const devices = DEVICES.filter((device) => device.kind === 'videoinput');

      let facingMode: VideoFacingModeEnum = 'environment';

      if (devices.length > 1) facingMode = this.shouldFaceUser ? 'user' : 'environment';

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode,
        },
      });

      this.video.addEventListener('loadedmetadata', async () => {
        this.video.setAttribute('width', this.video.videoWidth.toString());
        this.video.setAttribute('height', this.video.videoHeight.toString());

        await this._setupAR();

        this._processVideo();
        this.ui.hideLoading();
      });

      this.video.srcObject = stream;
    } catch (err) {
      console.log('getUserMedia error', err);
      this.el.emit('arError', { error: 'VIDEO_FAIL' });
    }
  },

  _processVideo: function () {
    this.controller.onUpdate = ({ hasFace, estimateResult }) => {
      if (hasFace && !this.lastHasFace) {
        this.el.emit('targetFound');
      }
      if (!hasFace && this.lastHasFace) {
        this.el.emit('targetLost');
      }

      this.lastHasFace = !!hasFace;

      if (hasFace && estimateResult) {
        const { faceMatrix } = estimateResult;
        for (let i = 0; i < this.anchorEntities.length; i++) {
          const landmarkMatrix = this.controller.getLandmarkMatrix(
            this.anchorEntities[i].anchorIndex
          );

          this.anchorEntities[i].el.updateVisibility(true);
          this.anchorEntities[i].el.updateMatrix(landmarkMatrix);
        }

        for (let i = 0; i < this.faceMeshEntities.length; i++) {
          this.faceMeshEntities[i].el.updateVisibility(true);
          this.faceMeshEntities[i].el.updateMatrix(faceMatrix);
        }
      } else {
        for (let i = 0; i < this.anchorEntities.length; i++) {
          this.anchorEntities[i].el.updateVisibility(false);
        }

        for (let i = 0; i < this.faceMeshEntities.length; i++) {
          this.faceMeshEntities[i].el.updateVisibility(false);
        }
      }
    };

    this.controller.processVideo(this.video);
  },

  _setupAR: async function () {
    this.controller = new ControllerClass({
      filterMinCF: this.filterMinCF,
      filterBeta: this.filterBeta,
    });

    this._resize();

    await this.controller.setup(this.video);
    await this.controller.dummyRun(this.video);

    const { fov, aspect, near, far } = this.controller.getCameraParams();

    const camera = new AFRAME.THREE.PerspectiveCamera();
    camera.fov = fov;
    camera.aspect = aspect;
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();

    const cameraEle = this.container.getElementsByTagName('a-camera')[0] as any;
    cameraEle.setObject3D('camera', camera);
    cameraEle.setAttribute('camera', 'active', true);

    for (let i = 0; i < this.faceMeshEntities.length; i++)
      this.faceMeshEntities[i].el.addFaceMesh(
        this.controller.createThreeFaceGeometry(AFRAME.THREE)
      );

    this._resize();
    window.addEventListener('resize', this._resize.bind(this));
    this.el.emit('arReady');
  },

  _resize: function () {
    const video = this.video;
    const container = this.container;
    let vw, vh; // display css width, height
    const videoRatio = video.videoWidth / video.videoHeight;
    const containerRatio = container.clientWidth / container.clientHeight;

    if (videoRatio > containerRatio) {
      vh = container.clientHeight;
      vw = vh * videoRatio;
    } else {
      vw = container.clientWidth;
      vh = vw / videoRatio;
    }

    this.video.style.top = -(vh - container.clientHeight) / 2 + 'px';
    this.video.style.left = -(vw - container.clientWidth) / 2 + 'px';
    this.video.style.width = vw + 'px';
    this.video.style.height = vh + 'px';

    const sceneEl = container.getElementsByTagName('a-scene')[0] as typeof AScene;

    sceneEl.style.top = this.video.style.top;
    sceneEl.style.left = this.video.style.left;
    sceneEl.style.width = this.video.style.width;
    sceneEl.style.height = this.video.style.height;
  },
});

export {};