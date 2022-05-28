/* eslint-disable @typescript-eslint/no-explicit-any */
import Stats from 'stats-js';
import { AScene } from 'aframe';
import { UI } from '../../ui/ui';
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
  location: Helper.castTo<GeolocationPosition>(null),
  mainStats: Helper.castTo<Stats>(null),
  ui: Helper.castTo<UI>(null),
  sytemState: SYSTEM_STATE.LOCATION_INITIALIZING,
  watchId: Helper.castTo<number>(null),
  shouldFaceUser: false,
  simulateLatitude: 0,
  simulateLongitude: 0,
  simulateAltitude: 0,
  positionMinAccuracy: 0,
  minDistance: 0,
  maxDistance: 0,
  gpsMinDistance: 0,
  gpsTimeInterval: 0,
  camera: Helper.castTo<typeof AScene>(null),
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

    this.ui = new UIClass({ uiLoading, uiScanning, uiError });
    this.controller = new ControllerClass();
  },

  setupCamera: function (props: Omit<CameraTrackerConstructor, 'controller'>) {
    if (!this.controller) return;

    // Prevent to register multiple cameras
    if (this.controller.camera) return;

    this.controller.setupCamera(props);

    this.isEmulated = props.simulateLatitude !== 0 && props.simulateLongitude !== 0;
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
    // this._startAR();
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

  update: function () {
    if (!this.isEmulated) return;

    this.controller.camera.getEmulatedPosition();
  },
});
