import { Entity } from 'aframe';
import UI from '../../ui/ui';
import Controller from '../controller';
import { Helper } from '../../libs';
import { AR_COMPONENT_NAME, AR_EVENT_NAME } from '../utils/constant';
import { AR_STATE, AR_ELEMENT_TAG, GLOBAL_AR_EVENT_NAME, VIDEO_ID } from '../../utils/constant';
import screenResizer from '../../utils/screen-resizer';
import {
  IFaceDefaultOccluder,
  IFaceSetupParams,
  IFaceTarget,
} from '../../../types/face-target/aframe';

const { Controller: ControllerClass, UI: UIClass } = window.MINDAR.FACE;

AFRAME.registerSystem(AR_COMPONENT_NAME.FACE_SYSTEM, {
  container: Helper.castTo<HTMLDivElement>(null),
  video: Helper.castTo<HTMLVideoElement>(null),
  anchorEntities: [] as { el: IFaceTarget; targetIndex: number }[],
  faceMeshEntities: [] as { el: IFaceDefaultOccluder }[],
  filterMinCF: -Infinity,
  filterBeta: Infinity,
  controller: Helper.castTo<Controller>(null),
  ui: Helper.castTo<UI>(null),

  el: Helper.castTo<Entity>(null),

  shouldFaceUser: true,
  lastHasFace: false,

  _positionSettings: 'absolute',
  _positionZIndex: -2,

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
    _positionSettings,
    _positionZIndex,
  }: IFaceSetupParams) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.ui = new UIClass({ uiLoading, uiScanning, uiError }) as any;
    this.filterMinCF = filterMinCF;
    this.filterBeta = filterBeta;
    this.shouldFaceUser = shouldFaceUser;

    if (!Helper.isNil(_positionSettings)) this._positionSettings = _positionSettings;
    if (!Helper.isNil(_positionZIndex)) this._positionZIndex = _positionZIndex;
  },

  registerFaceMesh: function (el: IFaceDefaultOccluder) {
    this.faceMeshEntities.push({ el });
  },

  registerAnchor: function (el: IFaceTarget, targetIndex: number) {
    this.anchorEntities.push({ el, targetIndex });
  },

  start: function () {
    if (!this.el.sceneEl || !this.el.sceneEl.parentNode) return;

    this.container = this.el.sceneEl.parentNode as HTMLDivElement;

    this.ui.showLoading();
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

      this.video.addEventListener(GLOBAL_AR_EVENT_NAME.LOADED_METADATA, async () => {
        this.video.setAttribute('width', this.video.videoWidth.toString());
        this.video.setAttribute('height', this.video.videoHeight.toString());

        await this._setupAR();

        this._processVideo();
        this.ui.hideLoading();
      });

      this.video.srcObject = stream;
    } catch (err) {
      console.log('getUserMedia error', err);
      this.el.emit(AR_STATE.AR_ERROR, { error: 'VIDEO_FAIL' });
    }
  },

  _processVideo: function () {
    this.controller.onUpdate = ({ hasFace, estimateResult }) => {
      if (hasFace && !this.lastHasFace) {
        this.el.emit(AR_EVENT_NAME.TARGET_FOUND);
      }

      if (!hasFace && this.lastHasFace) {
        this.el.emit(AR_EVENT_NAME.TARGET_LOST);
      }

      this.lastHasFace = !!hasFace;

      if (hasFace && estimateResult) {
        const { faceMatrix } = estimateResult;
        for (let i = 0; i < this.anchorEntities.length; i++) {
          const landmarkMatrix = this.controller.getLandmarkMatrix(
            this.anchorEntities[i].targetIndex
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    this._resize();

    await this.controller.setup(this.video);
    await this.controller.dummyRun(this.video);

    const { fov, aspect, near, far } = this.controller.getCameraParams();

    const camera = new AFRAME.THREE.PerspectiveCamera();
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    camera.fov = fov!;
    camera.aspect = aspect!;
    camera.near = near!;
    camera.far = far!;
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
    camera.updateProjectionMatrix();

    const cameraEle = this.container.getElementsByTagName(AR_ELEMENT_TAG.A_CAMERA)[0] as Entity;
    cameraEle.setObject3D(AR_ELEMENT_TAG.CAMERA, camera);
    cameraEle.setAttribute(AR_ELEMENT_TAG.CAMERA, 'active', true);

    for (let i = 0; i < this.faceMeshEntities.length; i++)
      this.faceMeshEntities[i].el.addFaceMesh(this.controller.createThreeFaceGeometry());

    this._resize();
    window.addEventListener(GLOBAL_AR_EVENT_NAME.SCREEN_RESIZE, this._resize.bind(this));
    this.el.emit(AR_STATE.AR_READY);
  },

  _resize: function () {
    screenResizer(this.video, this.container);

    const sceneEl = this.container.getElementsByTagName(AR_ELEMENT_TAG.A_SCENE)[0] as Entity;

    sceneEl.style.top = this.video.style.top;
    sceneEl.style.left = this.video.style.left;
    sceneEl.style.width = this.video.style.width;
    sceneEl.style.height = this.video.style.height;
  },
});
