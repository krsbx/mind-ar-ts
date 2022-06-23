/* eslint-disable @typescript-eslint/no-explicit-any */
import { Entity } from 'aframe';
import { BaseSystem, toSystem } from 'aframe-typescript-class-components';
import UI from '../../ui/ui';
import Controller from '../controller';
import { Helper } from '../../libs';
import { AR_COMPONENT_NAME, AR_EVENT_NAME } from '../utils/constant';
import { AR_STATE, AR_ELEMENT_TAG, GLOBAL_AR_EVENT_NAME } from '../../utils/constant';
import screenResizer from '../../utils/screen-resizer';
import { MindARFaceTarget } from './face-target';
import { MindARFaceDefaultOccluder } from './face-default-occluder';

const { Controller: ControllerClass, UI: UIClass } = window.MINDAR.FACE;

export class MindARFaceSystem extends BaseSystem {
  container!: HTMLDivElement;
  video!: HTMLVideoElement;
  anchorEntities: { el: MindARFaceTarget; targetIndex: number }[] = [];
  faceMeshEntities: { el: MindARFaceDefaultOccluder }[] = [];
  filterMinCF = -Infinity;
  filterBeta = Infinity;
  controller!: Controller;
  ui!: UI;

  shouldFaceUser = true;
  lastHasFace = false;

  public init() {
    this.anchorEntities = [];
    this.faceMeshEntities = [];
  }

  public setup({
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
    shouldFaceUser: boolean;
  }) {
    this.ui = new UIClass({ uiLoading, uiScanning, uiError }) as any;
    this.filterMinCF = filterMinCF;
    this.filterBeta = filterBeta;
    this.shouldFaceUser = shouldFaceUser;
  }

  public registerFaceMesh(el: MindARFaceDefaultOccluder) {
    this.faceMeshEntities.push({ el });
  }

  public registerAnchor(el: MindARFaceTarget, targetIndex: number) {
    this.anchorEntities.push({ el, targetIndex });
  }

  public start() {
    if (!this.el.sceneEl || !this.el.sceneEl.parentNode) return;

    this.container = this.el.sceneEl.parentNode as HTMLDivElement;

    this.ui.showLoading();
    this._startVideo();
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
  }

  private _processVideo() {
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
  }

  private async _setupAR() {
    this.controller = Helper.castTo<Controller>(
      new ControllerClass({
        filterMinCF: this.filterMinCF,
        filterBeta: this.filterBeta,
      })
    );

    this._resize();

    await this.controller.setup(this.video);
    await this.controller.dummyRun(this.video);

    const { fov, aspect, near, far } = this.controller.getCameraParams();

    const camera = new AFRAME.THREE.PerspectiveCamera() as any;
    camera.fov = fov;
    camera.aspect = aspect;
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();

    const cameraEle = this.container.getElementsByTagName(AR_ELEMENT_TAG.A_CAMERA)[0] as Entity;
    cameraEle.setObject3D(AR_ELEMENT_TAG.CAMERA, camera);
    cameraEle.setAttribute(AR_ELEMENT_TAG.CAMERA, 'active', true);

    for (let i = 0; i < this.faceMeshEntities.length; i++)
      this.faceMeshEntities[i].el.addFaceMesh(this.controller.createThreeFaceGeometry());

    this._resize();
    window.addEventListener(GLOBAL_AR_EVENT_NAME.SCREEN_RESIZE, this._resize.bind(this));
    this.el.emit(AR_STATE.AR_READY);
  }

  private _resize() {
    screenResizer(this.video, this.container);

    const sceneEl = this.container.getElementsByTagName(AR_ELEMENT_TAG.A_SCENE)[0] as Entity;

    sceneEl.style.top = this.video.style.top;
    sceneEl.style.left = this.video.style.left;
    sceneEl.style.width = this.video.style.width;
    sceneEl.style.height = this.video.style.height;
  }
}

AFRAME.registerSystem(AR_COMPONENT_NAME.FACE_SYSTEM, toSystem(MindARFaceSystem));
