/* eslint-disable @typescript-eslint/no-explicit-any */
import Stats from 'stats-js';
import { UI } from '../../ui/ui';
import { Helper } from '../../libs';
import { AR_ELEMENT_TAG, AR_STATE, GLOBAL_AR_EVENT_NAME, STATS_STYLE } from '../../utils/constant';
import { AR_COMPONENT_NAME, SYSTEM_STATE } from '../utils/constant';
import { AScene } from 'aframe';
import screenResizer from '../../utils/screen-resizer';

const { UI: UIClass } = window.MINDAR.LOCATION;

AFRAME.registerSystem(AR_COMPONENT_NAME.LOCATION_SYSTEM, {
  container: Helper.castTo<HTMLDivElement>(null),
  video: Helper.castTo<HTMLVideoElement>(null),
  anchorEntities: [] as any[],
  el: null as any,
  showStats: false,
  location: Helper.castTo<GeolocationPosition>(null),
  mainStats: Helper.castTo<Stats>(null),
  ui: Helper.castTo<UI>(null),
  sytemState: SYSTEM_STATE.LOCATION_INITIALIZING,
  watchId: Helper.castTo<number>(null),
  shouldFaceUser: false,

  init: function () {
    this.anchorEntities = [];
  },

  tick: function () {
    console.log(this.location);
  },

  setup: function ({
    showStats,
    uiLoading,
    uiScanning,
    uiError,
    shouldFaceUser,
  }: {
    showStats: boolean;
    uiLoading: string;
    uiScanning: string;
    uiError: string;
    shouldFaceUser: boolean;
  }) {
    this.showStats = showStats;
    this.shouldFaceUser = shouldFaceUser;

    this.ui = new UIClass({ uiLoading, uiScanning, uiError });
  },

  registerAnchor: function (el: any, targetIndex: number) {
    this.anchorEntities.push({ el, targetIndex });
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

        this._startLocationTracking();
      });

      this.video.srcObject = stream;
    } catch (err) {
      console.log('getUserMedia error', err);
      this.el.emit(AR_STATE.AR_ERROR, { error: 'VIDEO_FAIL' });
    }
  },

  _watchPositionSuccess: function (system: any) {
    return function (position: GeolocationPosition) {
      if (system.sytemState === SYSTEM_STATE.LOCATION_INITIALIZING)
        system.sytemState = SYSTEM_STATE.LOCATION_READY;

      system.location = position;
    };
  },

  _watchPositionError: function (system: any) {
    return function () {
      if (system.sytemState === SYSTEM_STATE.LOCATION_INITIALIZING)
        system.sytemState = SYSTEM_STATE.LOCATION_ERROR;

      if (system.sytemState !== SYSTEM_STATE.LOCATION_ERROR) return;

      system.el.emit(AR_STATE.AR_ERROR, { error: 'LOCATION_FAIL' });
      navigator.geolocation.clearWatch(system.watchId);
    };
  },

  _startLocationTracking: function () {
    if (
      !navigator.geolocation ||
      !navigator.geolocation.getCurrentPosition ||
      !navigator.geolocation.watchPosition
    ) {
      // TODO: show unsupported error
      this.el.emit(AR_STATE.AR_ERROR, { error: 'LOCATION_FAIL' });
      this.ui.showCompatibility();

      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      this._watchPositionSuccess(this),
      this._watchPositionError(this)
    );

    this._startAR();
  },

  _startAR: function () {
    this._resize();
    window.addEventListener(GLOBAL_AR_EVENT_NAME.SCREEN_RESIZE, this._resize.bind(this));

    this.el.emit(AR_STATE.AR_READY);
    this.ui.hideLoading();
  },

  _resize: function () {
    screenResizer(this.video, this.container);

    const sceneEl = this.container.getElementsByTagName(AR_ELEMENT_TAG.A_SCENE)[0] as typeof AScene;

    sceneEl.style.top = this.video.style.top;
    sceneEl.style.left = this.video.style.left;
    sceneEl.style.width = this.video.style.width;
    sceneEl.style.height = this.video.style.height;
  },
});
