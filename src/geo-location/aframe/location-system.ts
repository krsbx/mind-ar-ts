/* eslint-disable @typescript-eslint/no-explicit-any */
import Stats from 'stats-js';
import { Scene } from 'aframe';
import UI from '../../ui/ui';
import { Controller } from '../controller';
import { Helper } from '../../libs';
import { AR_ELEMENT_TAG, AR_STATE, GLOBAL_AR_EVENT_NAME, STATS_STYLE } from '../../utils/constant';
import { AR_COMPONENT_NAME, SYSTEM_STATE } from '../utils/constant';
import screenResizer from '../../utils/screen-resizer';
import { CameraTrackerConstructor, LocationTrackerConstructor } from '../utils/types/geo-location';

const { Controller: ControllerClass, UI: UIClass } = window.MINDAR.LOCATION;

AFRAME.registerSystem(AR_COMPONENT_NAME.LOCATION_SYSTEM, {
  container: Helper.castTo<HTMLDivElement>(null),
  video: Helper.castTo<HTMLVideoElement>(null),
  el: null as any,
  showStats: false,
  controller: Helper.castTo<Controller>(null),
  mainStats: Helper.castTo<Stats>(null),
  ui: Helper.castTo<UI>(null),
  sytemState: SYSTEM_STATE.LOCATION_INITIALIZING,
  shouldFaceUser: false,
  isEmulated: false,

  setup: function ({
    showStats,
    uiLoading,
    uiScanning,
    uiError,
  }: {
    uiLoading: string;
    uiScanning: string;
    uiError: string;
    showStats: boolean;
  }) {
    this.showStats = showStats;

    this.ui = new UIClass({ uiLoading, uiScanning, uiError }) as any;
    this.controller = new ControllerClass();

    this.el.emit(SYSTEM_STATE.LOCATION_INITIALIZED);
  },

  setupCamera: function (props: Omit<CameraTrackerConstructor, 'controller'>) {
    if (!this.controller) return;

    // Prevent to register multiple cameras
    if (this.controller.camera) return;

    this.el.emit(SYSTEM_STATE.CAMERA_INITIALIZING);

    this.controller.setupCamera(props);

    this.isEmulated = props.simulateLatitude !== 0 && props.simulateLongitude !== 0;

    this.el.emit(SYSTEM_STATE.CAMERA_INITIALIZED);
  },

  addLocation: function (props: Omit<LocationTrackerConstructor, 'controller'>) {
    if (!this.controller) return;

    this.controller.addLocation(props);
  },

  start: function () {
    this.container = this.el.sceneEl.parentNode;

    if (this.showStats) {
      this.mainStats = new Stats();
      this.mainStats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
      this.mainStats.domElement.style.cssText = STATS_STYLE;
      this.container.appendChild(this.mainStats.domElement);
    }

    this.ui.showLoading();
    this._startVideo();
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

  _startAR: function () {
    this._resize();
    window.addEventListener(GLOBAL_AR_EVENT_NAME.SCREEN_RESIZE, this._resize.bind(this));

    this.el.emit(AR_STATE.AR_READY);
    this.controller.startAR();
    this.ui.hideLoading();
  },

  _resize: function () {
    screenResizer(this.video, this.container);

    const sceneEl = this.container.getElementsByTagName(AR_ELEMENT_TAG.A_SCENE)[0] as Scene;

    sceneEl.style.top = this.video.style.top;
    sceneEl.style.left = this.video.style.left;
    sceneEl.style.width = this.video.style.width;
    sceneEl.style.height = this.video.style.height;
  },

  update: function () {
    if (!this.isEmulated) return;

    this.controller.camera.getEmulatedPosition();
  },
});
