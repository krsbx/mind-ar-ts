import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer';
import Controller from './controller';
import { IAnchor, IOnUpdateArgs, Matrix4Args, ThreeConstructor } from './utils/types/face-target';
import UI from '../ui/ui';
import { Helper } from '../libs';

class MindARThree {
  private container: HTMLDivElement;
  private video!: HTMLVideoElement;
  private ui: UI;
  private controller: Controller;
  private scene: THREE.Scene;
  private cssScene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private cssRenderer: CSS3DRenderer;
  private camera: THREE.PerspectiveCamera;
  private shouldFaceUser: boolean;
  private anchors: IAnchor[];
  private faceMeshes: THREE.Mesh<
    ReturnType<Controller['createThreeFaceGeometry']>,
    THREE.MeshStandardMaterial
  >[];

  constructor({
    container,
    uiLoading = 'yes',
    uiScanning = 'yes',
    uiError = 'yes',
    filterMinCF = null,
    filterBeta = null,
    shouldFaceUser = true,
  }: ThreeConstructor) {
    this.container = container;
    this.ui = new UI({ uiLoading, uiScanning, uiError });

    this.controller = new Controller({
      filterMinCF: filterMinCF,
      filterBeta: filterBeta,
    });

    this.scene = new THREE.Scene();
    this.cssScene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.cssRenderer = new CSS3DRenderer();
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.camera = new THREE.PerspectiveCamera();

    this.anchors = [];
    this.faceMeshes = [];

    this.container.appendChild(this.renderer.domElement);
    this.container.appendChild(this.cssRenderer.domElement);

    this.shouldFaceUser = shouldFaceUser;

    window.addEventListener('resize', this._resize.bind(this));
  }

  async start() {
    this.ui.showLoading();

    await this._startVideo();
    await this._startAR();

    this.ui.hideLoading();
  }

  stop() {
    const { srcObject } = this.video;

    if (!srcObject) return;

    const tracks = (srcObject as MediaStream).getTracks();

    tracks.forEach(function (track) {
      track.stop();
    });

    this.video.remove();
    this.controller.stopProcessVideo();
  }

  // Reinitialize camera by restarting it
  reInitialize() {
    // Stop then start to reinizitialize
    this.stop();
    this.start();
  }

  switchCamera() {
    this.shouldFaceUser = !this.shouldFaceUser;

    this.reInitialize();
  }

  addFaceMesh() {
    const faceGeometry = this.controller.createThreeFaceGeometry();
    const faceMesh = new THREE.Mesh(
      faceGeometry,
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );

    faceMesh.visible = false;
    faceMesh.matrixAutoUpdate = false;

    this.faceMeshes.push(faceMesh);

    return faceMesh;
  }

  addAnchor(landmarkIndex: number) {
    const group = new THREE.Group();
    group.matrixAutoUpdate = false;

    const anchor = { group, landmarkIndex, css: false };
    this.anchors.push(anchor);
    this.scene.add(group);

    return anchor;
  }

  addCSSAnchor(landmarkIndex: number) {
    const group = new THREE.Group();
    group.matrixAutoUpdate = false;

    const anchor = { group, landmarkIndex, css: true };
    this.anchors.push(anchor);
    this.cssScene.add(group);

    return anchor;
  }

  _startVideo() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve, reject) => {
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
        this.ui.showCompatibility();
        reject();
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

          resolve();
        });

        this.video.srcObject = stream;
      } catch (err) {
        console.log('getUserMedia error', err);

        reject();
      }
    });
  }

  _onARUpdate({ hasFace, estimateResult }: IOnUpdateArgs) {
    for (let i = 0; i < this.anchors.length; i++) {
      if (this.anchors[i].css) {
        this.anchors[i].group.children.forEach((obj) => {
          (obj as THREE.Object3D<THREE.Event> & { element: HTMLElement }).element.style.visibility =
            !hasFace ? 'hidden' : 'visible';
        });
      } else {
        this.anchors[i].group.visible = !!hasFace;
      }
    }

    for (let i = 0; i < this.faceMeshes.length; i++) {
      this.faceMeshes[i].visible = !!hasFace;
    }

    if (!hasFace || !estimateResult) return;

    const { faceMatrix } = estimateResult;

    for (let i = 0; i < this.anchors.length; i++) {
      const landmarkIndex = this.anchors[i].landmarkIndex;
      const landmarkMatrix = this.controller.getLandmarkMatrix(landmarkIndex);

      if (Helper.isNil(landmarkMatrix) || Helper.isNil(landmarkIndex)) continue;

      // Forcefully turn landmark matrix type to a tupple 4x4
      const newLandmarkMatrix = Helper.castTo<Matrix4Args>(landmarkMatrix);

      if (this.anchors[i].css) {
        const cssScale = 0.001;
        const scaledElements = [
          cssScale * landmarkMatrix[0],
          cssScale * landmarkMatrix[1],
          landmarkMatrix[2],
          landmarkMatrix[3],
          cssScale * landmarkMatrix[4],
          cssScale * landmarkMatrix[5],
          landmarkMatrix[6],
          landmarkMatrix[7],
          cssScale * landmarkMatrix[8],
          cssScale * landmarkMatrix[9],
          landmarkMatrix[10],
          landmarkMatrix[11],
          cssScale * landmarkMatrix[12],
          cssScale * landmarkMatrix[13],
          landmarkMatrix[14],
          landmarkMatrix[15],
        ] as const;

        this.anchors[i].group.matrix.set(...scaledElements);
      } else {
        this.anchors[i].group.matrix.set(...newLandmarkMatrix);
      }
    }

    // Forcefully turn face matrix type to a tupple 4x4
    const newFaceMatrix = Helper.castTo<Matrix4Args>(faceMatrix);

    for (let i = 0; i < this.faceMeshes.length; i++) {
      this.faceMeshes[i].matrix.set(...newFaceMatrix);
    }
  }

  private _setCameraParams() {
    const { fov, aspect, near, far } = this.controller.getCameraParams();

    if (!Helper.isNil(fov)) this.camera.fov = fov;
    if (!Helper.isNil(aspect)) this.camera.aspect = aspect;
    if (!Helper.isNil(near)) this.camera.near = near;
    if (!Helper.isNil(far)) this.camera.far = far;
  }

  _startAR() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve) => {
      const video = this.video;

      this.controller.onUpdate = this._onARUpdate;

      this._resize();
      await this.controller.setup(video);

      this._setCameraParams();

      this.camera.updateProjectionMatrix();

      this.renderer.setSize(this.video.videoWidth, this.video.videoHeight);
      this.cssRenderer.setSize(this.video.videoWidth, this.video.videoHeight);

      await this.controller.dummyRun(video);

      this._resize();
      this.controller.processVideo(video);
      resolve();
    });
  }

  _resize() {
    const { renderer, cssRenderer, container, video } = this;
    if (!video) return;

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

    video.style.top = -(vh - container.clientHeight) / 2 + 'px';
    video.style.left = -(vw - container.clientWidth) / 2 + 'px';
    video.style.width = vw + 'px';
    video.style.height = vh + 'px';

    const canvas = renderer.domElement;
    const cssCanvas = cssRenderer.domElement;

    canvas.style.position = 'absolute';
    canvas.style.left = video.style.left;
    canvas.style.right = video.style.right;
    canvas.style.width = video.style.width;
    canvas.style.height = video.style.height;

    cssCanvas.style.position = 'absolute';
    cssCanvas.style.left = video.style.left;
    cssCanvas.style.right = video.style.right;

    cssCanvas.style.transformOrigin = 'top left';
    cssCanvas.style.transform =
      'scale(' +
      vw / parseFloat(cssCanvas.style.width) +
      ',' +
      vh / parseFloat(cssCanvas.style.height) +
      ')';
  }
}

if (!window.MINDAR.FACE.MindARThree)
  window.MINDAR.FACE.MindARThree = MindARThree as typeof window.MINDAR.FACE.MindARThree;

if (!window.MINDAR.FACE.THREE) window.MINDAR.FACE.THREE = THREE;

export default MindARThree;
