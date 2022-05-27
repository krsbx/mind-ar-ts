/* eslint-disable @typescript-eslint/no-explicit-any */
import Stats from 'stats-js';
import { AScene } from 'aframe';
import { UI } from '../../ui/ui';
import { Controller } from '../controller';
import { Helper } from '../../libs';
import { AR_ELEMENT_TAG, AR_STATE, GLOBAL_AR_EVENT_NAME, STATS_STYLE } from '../../utils/constant';
import { AR_COMPONENT_NAME, SYSTEM_STATE } from '../utils/constant';
import screenResizer from '../../utils/screen-resizer';

const { Controller: ControllerClass, UI: UIClass } = window.MINDAR.LOCATION;

AFRAME.registerSystem(AR_COMPONENT_NAME.LOCATION_SYSTEM, {
  container: Helper.castTo<HTMLDivElement>(null),
  video: Helper.castTo<HTMLVideoElement>(null),
  anchorEntities: [] as any[],
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
    simulateLatitude,
    simulateLongitude,
    simulateAltitude,
    positionMinAccuracy,
    minDistance,
    maxDistance,
    gpsMinDistance,
    gpsTimeInterval,
  }: {
    uiLoading: string;
    uiScanning: string;
    uiError: string;
    showStats: boolean;
    shouldFaceUser: boolean;
    simulateLatitude: number;
    simulateLongitude: number;
    simulateAltitude: number;
    positionMinAccuracy: number;
    minDistance: number;
    maxDistance: number;
    gpsMinDistance: number;
    gpsTimeInterval: number;
  }) {
    this.showStats = showStats;
    this.shouldFaceUser = shouldFaceUser;
    this.simulateAltitude = simulateAltitude;
    this.simulateLatitude = simulateLatitude;
    this.simulateLongitude = simulateLongitude;
    this.positionMinAccuracy = positionMinAccuracy;
    this.minDistance = minDistance;
    this.maxDistance = maxDistance;
    this.gpsMinDistance = gpsMinDistance;
    this.gpsTimeInterval = gpsTimeInterval;

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
    this._startAR();
  },

  _startAR: function () {
    this.controller = new ControllerClass({
      simulateAltitude: this.simulateAltitude,
      simulateLatitude: this.simulateLatitude,
      simulateLongitude: this.simulateLongitude,
      positionMinAccuracy: this.positionMinAccuracy,
      minDistance: this.minDistance,
      maxDistance: this.maxDistance,
      gpsMinDistance: this.gpsMinDistance,
      gpsTimeInterval: this.gpsTimeInterval,
    });

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
