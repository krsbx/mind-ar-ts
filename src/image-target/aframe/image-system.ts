import Stats from 'stats-js';
import { Entity } from 'aframe';
import UI from '../../ui/ui';
import Controller from '../controller';
import { ON_UPDATE_EVENT } from '../utils/constant/controller';
import { IOnUpdate } from '../utils/types/controller';
import { Helper } from '../../libs';
import { AR_COMPONENT_NAME, AR_EVENT_NAME } from '../utils/constant/aframe';
import {
  AR_STATE,
  AR_ELEMENT_TAG,
  GLOBAL_AR_EVENT_NAME,
  STATS_STYLE,
  VIDEO_ID,
} from '../../utils/constant';
import screenResizer from '../../utils/screen-resizer';
import { IImageSetupParams, IImageTarget } from '../../../types/image-target/aframe';

const { Controller: ControllerClass, UI: UIClass } = window.MINDAR.IMAGE;

AFRAME.registerSystem(AR_COMPONENT_NAME.IMAGE_SYSTEM, {
  container: Helper.castTo<HTMLDivElement>(null),
  video: Helper.castTo<HTMLVideoElement>(null),
  anchorEntities: [] as { el: IImageTarget; targetIndex: number }[],
  imageTargetSrc: '',
  maxTrack: -1,
  filterMinCF: -Infinity,
  filterBeta: Infinity,
  missTolerance: -Infinity,
  warmupTolerance: -Infinity,
  showStats: false,
  controller: Helper.castTo<Controller>(null),
  ui: Helper.castTo<UI>(null),
  el: Helper.castTo<Entity>(null),
  mainStats: Helper.castTo<Stats>(null),
  reshowScanning: true,
  shouldFaceUser: false,

  _positionSettings: 'absolute',
  _positionZIndex: -2,

  init: function () {
    this.anchorEntities = [];
  },

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
    reshowScanning,
    shouldFaceUser,
    _positionSettings,
    _positionZIndex,
  }: IImageSetupParams) {
    this.imageTargetSrc = imageTargetSrc;
    this.maxTrack = maxTrack;
    this.filterMinCF = filterMinCF;
    this.filterBeta = filterBeta;
    this.missTolerance = missTolerance;
    this.warmupTolerance = warmupTolerance;
    this.showStats = showStats;
    this.reshowScanning = reshowScanning;
    this.shouldFaceUser = shouldFaceUser;

    if (!Helper.isNil(_positionSettings)) this._positionSettings = _positionSettings;
    if (!Helper.isNil(_positionZIndex)) this._positionZIndex = _positionZIndex;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.ui = new UIClass({ uiLoading, uiScanning, uiError }) as any;
    this._registerEventListener();
  },

  _registerEventListener: function () {
    // Subcribe to the targetFound event
    // This event is fired when the target is found
    this.el.addEventListener(AR_EVENT_NAME.MARKER_FOUND, () => {
      this.ui.hideScanning();
    });

    // Subcribe to the targetFound event
    // This event is fired when the target is found
    this.el.addEventListener(AR_EVENT_NAME.MARKER_LOST, () => {
      if (this.reshowScanning) this.ui.showScanning();
    });
  },

  registerAnchor: function (el: IImageTarget, targetIndex: number) {
    this.anchorEntities.push({ el, targetIndex });
  },

  start: function () {
    if (!this.el.sceneEl || !this.el.sceneEl.parentNode) return;

    this.container = this.el.sceneEl.parentNode as HTMLDivElement;

    if (this.showStats) {
      this.mainStats = new Stats();
      this.mainStats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
      this.mainStats.domElement.style.cssText = STATS_STYLE;
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

    this.video.id = VIDEO_ID;
    this.video.setAttribute('autoplay', '');
    this.video.setAttribute('muted', '');
    this.video.setAttribute('playsinline', '');

    this.video.style.position = this._positionSettings;
    this.video.style.top = '0px';
    this.video.style.left = '0px';
    this.video.style.zIndex = `${this._positionZIndex}`;

    this.container.appendChild(this.video);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // TODO: show unsupported error
      this.el.emit(AR_STATE.AR_ERROR, { error: 'VIDEO_FAIL' });
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

      this.video.addEventListener(GLOBAL_AR_EVENT_NAME.LOADED_METADATA, () => {
        this.video.setAttribute('width', this.video.videoWidth.toString());
        this.video.setAttribute('height', this.video.videoHeight.toString());
        this._startAR();
      });

      this.video.srcObject = stream;
    } catch (err) {
      console.log('getUserMedia error', err);
      this.el.emit(AR_STATE.AR_ERROR, { error: 'VIDEO_FAIL' });
    }
  },

  _startAR: async function () {
    this.controller = new ControllerClass({
      inputWidth: this.video.videoWidth,
      inputHeight: this.video.videoHeight,
      maxTrack: this.maxTrack,
      filterMinCF: this.filterMinCF,
      filterBeta: this.filterBeta,
      missTolerance: this.missTolerance,
      warmupTolerance: this.warmupTolerance,
      onUpdate: (data: IOnUpdate) => {
        switch (data.type) {
          case ON_UPDATE_EVENT.DONE:
            if (this.mainStats) this.mainStats.update();
            break;
          case ON_UPDATE_EVENT.UPDATE_MATRIX:
            // eslint-disable-next-line no-case-declarations
            const { targetIndex, worldMatrix } = data;

            for (const anchorEntity of this.anchorEntities) {
              if (anchorEntity.targetIndex === targetIndex)
                anchorEntity.el.updateWorldMatrix(worldMatrix);
            }

            break;
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    this._resize();
    window.addEventListener(GLOBAL_AR_EVENT_NAME.SCREEN_RESIZE, this._resize.bind(this));

    const { dimensions: imageTargetDimensions } = await this.controller.addImageTargets(
      this.imageTargetSrc
    );

    for (const anchorEntity of this.anchorEntities) {
      const { el, targetIndex } = anchorEntity;

      if (targetIndex < imageTargetDimensions.length)
        el.setupMarker(imageTargetDimensions[targetIndex]);
    }

    await this.controller.dummyRun(this.video);
    this.el.emit(AR_STATE.AR_READY);
    this.ui.hideLoading();
    this.ui.showScanning();

    this.controller.processVideo(this.video);
  },

  _resize: function () {
    const { vh } = screenResizer(this.video, this.container);

    const container = this.container;

    const proj = this.controller.getProjectionMatrix();
    const fov = (2 * Math.atan((1 / proj[5] / vh) * container.clientHeight) * 180) / Math.PI; // vertical fov
    const near = proj[14] / (proj[10] - 1.0);
    const far = proj[14] / (proj[10] + 1.0);

    const newAspect = container.clientWidth / container.clientHeight;
    const cameraEle = container.getElementsByTagName(AR_ELEMENT_TAG.A_CAMERA)[0] as Entity;

    const camera = cameraEle.getObject3D(AR_ELEMENT_TAG.CAMERA) as THREE.PerspectiveCamera;
    camera.fov = fov;
    camera.aspect = newAspect;
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();
  },
});
