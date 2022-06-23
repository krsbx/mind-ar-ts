/* eslint-disable @typescript-eslint/no-explicit-any */
import Stats from 'stats-js';
import { Entity } from 'aframe';
import UI from '../../ui/ui';
import Controller from '../controller';
import { ON_UPDATE_EVENT } from '../utils/constant/controller';
import { IOnUpdate } from '../utils/types/controller';
import { Helper } from '../../libs';
import { AR_COMPONENT_NAME, AR_EVENT_NAME } from '../utils/constant/aframe';
import { AR_STATE, AR_ELEMENT_TAG, GLOBAL_AR_EVENT_NAME, STATS_STYLE } from '../../utils/constant';
import screenResizer from '../../utils/screen-resizer';
import { BaseSystem, toSystem } from 'aframe-typescript-class-components';
import { MindARImageTarget } from './image-target';

const { Controller: ControllerClass, UI: UIClass } = window.MINDAR.IMAGE;

export class MindARImageSystem extends BaseSystem {
  container!: HTMLDivElement;
  video!: HTMLVideoElement;
  anchorEntities: { el: MindARImageTarget; targetIndex: number }[] = [];
  imageTargetSrc = '';
  maxTrack = -1;
  filterMinCF = -Infinity;
  filterBeta = Infinity;
  missTolerance = -Infinity;
  warmupTolerance = -Infinity;
  showStats = false;
  controller!: Controller;
  ui!: UI;
  mainStats!: Stats;
  reshowScanning = true;
  shouldFaceUser = false;

  public init() {
    this.anchorEntities = [];
  }

  public setup({
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
    reshowScanning: boolean;
    shouldFaceUser: boolean;
  }) {
    this.imageTargetSrc = imageTargetSrc;
    this.maxTrack = maxTrack;
    this.filterMinCF = filterMinCF;
    this.filterBeta = filterBeta;
    this.missTolerance = missTolerance;
    this.warmupTolerance = warmupTolerance;
    this.showStats = showStats;
    this.reshowScanning = reshowScanning;
    this.shouldFaceUser = shouldFaceUser;

    this.ui = new UIClass({ uiLoading, uiScanning, uiError }) as any;
    this._registerEventListener();
  }

  private _registerEventListener() {
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
  }

  public registerAnchor(el: MindARImageTarget, targetIndex: number) {
    this.anchorEntities.push({ el, targetIndex });
  }

  public start() {
    if (!this.el.sceneEl) return;

    this.container = Helper.castTo<HTMLDivElement>(this.el.sceneEl.parentNode);

    if (this.showStats) {
      this.mainStats = new Stats();
      this.mainStats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
      this.mainStats.domElement.style.cssText = STATS_STYLE;
      this.container.appendChild(this.mainStats.domElement);
    }

    this.ui.showLoading();
    this._startVideo();
  }

  public switchTarget(targetIndex: number) {
    this.controller.interestedTargetIndex = targetIndex;
  }

  public stop() {
    this.pause();

    if (!this.video) return;

    const { srcObject } = this.video;

    if (!srcObject) return;

    const tracks = (srcObject as MediaStream).getTracks();

    tracks.forEach(function (track) {
      track.stop();
    });

    this.video.remove();
  }

  public switchCamera() {
    this.shouldFaceUser = !this.shouldFaceUser;

    this.stop();
    this.start();
  }

  public pause(keepVideo = false) {
    if (!keepVideo) this.video.pause();

    this.controller.stopProcessVideo();
  }

  public unpause() {
    this.video.play();
    this.controller.processVideo(this.video);
  }

  private async _startVideo() {
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
  }

  private async _startAR() {
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
  }

  private _resize() {
    const { vh } = screenResizer(this.video, this.container);

    const container = this.container;

    const proj = this.controller.getProjectionMatrix();
    const fov = (2 * Math.atan((1 / proj[5] / vh) * container.clientHeight) * 180) / Math.PI; // vertical fov
    const near = proj[14] / (proj[10] - 1.0);
    const far = proj[14] / (proj[10] + 1.0);

    const newAspect = container.clientWidth / container.clientHeight;
    const cameraEle = container.getElementsByTagName(AR_ELEMENT_TAG.A_CAMERA)[0] as Entity;

    const camera = cameraEle.getObject3D(AR_ELEMENT_TAG.CAMERA) as any;
    camera.fov = fov;
    camera.aspect = newAspect;
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();
  }
}

AFRAME.registerSystem(AR_COMPONENT_NAME.IMAGE_SYSTEM, toSystem(MindARImageSystem));
