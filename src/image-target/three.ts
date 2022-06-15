import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer';
import Controller from './controller';
import UI from '../ui/ui';
import { ON_UPDATE_EVENT } from './utils/constant/controller';
import { IOnUpdate } from './utils/types/controller';
import { ThreeConstructor, IAnchor } from './utils/types/image-target';
import { Helper } from '../libs';

const cssScaleDownMatrix = new THREE.Matrix4();
cssScaleDownMatrix.compose(
  new THREE.Vector3(),
  new THREE.Quaternion(),
  new THREE.Vector3(0.001, 0.001, 0.001)
);

class MindARThree {
  private container: HTMLDivElement;
  private imageTargetSrc: string;
  private maxTrack: number;
  private filterMinCF: number | null;
  private filterBeta: number | null;
  private warmupTolerance: number | null;
  private missTolerance: number | null;
  private ui: UI;
  private scene: THREE.Scene;
  private cssScene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private cssRenderer: CSS3DRenderer;
  private camera: THREE.PerspectiveCamera;
  private anchors: IAnchor[];
  private controller!: Controller;
  private video!: HTMLVideoElement;
  private postMatrixs!: THREE.Matrix4[];

  constructor({
    container,
    imageTargetSrc,
    maxTrack,
    uiLoading = 'yes',
    uiScanning = 'yes',
    uiError = 'yes',
    filterMinCF = null,
    filterBeta = null,
    warmupTolerance = null,
    missTolerance = null,
  }: ThreeConstructor) {
    this.container = container;
    this.imageTargetSrc = imageTargetSrc;
    this.maxTrack = maxTrack;
    this.filterMinCF = filterMinCF;
    this.filterBeta = filterBeta;
    this.warmupTolerance = warmupTolerance;
    this.missTolerance = missTolerance;

    this.ui = new UI({ uiLoading, uiScanning, uiError });

    this.scene = new THREE.Scene();
    this.cssScene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.cssRenderer = new CSS3DRenderer();
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.camera = new THREE.PerspectiveCamera();
    this.anchors = [];

    this.renderer.domElement.style.position = 'absolute';
    this.cssRenderer.domElement.style.position = 'absolute';
    this.container.appendChild(this.renderer.domElement);
    this.container.appendChild(this.cssRenderer.domElement);

    window.addEventListener('resize', this.resize.bind(this));
  }

  async start() {
    this.ui.showLoading();
    await this._startVideo();
    await this._startAR();
  }

  stop() {
    this.controller.stopProcessVideo();

    const { srcObject } = this.video;

    if (!srcObject) return;

    const tracks = (srcObject as MediaStream).getTracks();

    tracks.forEach((track) => {
      track.stop();
    });

    this.video.remove();
  }

  addAnchor(targetIndex: number) {
    const group = new THREE.Group();
    group.visible = false;
    group.matrixAutoUpdate = false;

    const anchor = {
      group,
      targetIndex,
      onTargetFound: null,
      onTargetLost: null,
      css: false,
      visible: false,
    };

    this.anchors.push(anchor);
    this.scene.add(group);

    return anchor;
  }

  addCSSAnchor(targetIndex: number) {
    const group = new THREE.Group();
    group.visible = false;
    group.matrixAutoUpdate = false;

    const anchor = {
      group,
      targetIndex,
      onTargetFound: null,
      onTargetLost: null,
      css: true,
      visible: false,
    };

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

  _startAR() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve) => {
      this.controller = new Controller({
        inputWidth: this.video.videoWidth,
        inputHeight: this.video.videoHeight,
        filterMinCF: this.filterMinCF,
        filterBeta: this.filterBeta,
        warmupTolerance: this.warmupTolerance,
        missTolerance: this.missTolerance,
        maxTrack: this.maxTrack,
        onUpdate: (data: IOnUpdate) => {
          switch (data.type) {
            case ON_UPDATE_EVENT.UPDATE_MATRIX:
              // eslint-disable-next-line no-case-declarations
              const { targetIndex, worldMatrix } = data;

              for (let i = 0; i < this.anchors.length; i++) {
                if (this.anchors[i].targetIndex === targetIndex) {
                  if (this.anchors[i].css)
                    this.anchors[i].group.children.forEach((obj) => {
                      (
                        obj as THREE.Object3D<THREE.Event> & { element: HTMLElement }
                      ).element.style.visibility = !worldMatrix ? 'hidden' : 'visible';
                    });
                  else this.anchors[i].group.visible = !!worldMatrix;

                  if (worldMatrix) {
                    const m = new THREE.Matrix4();
                    m.elements = [...worldMatrix];
                    m.multiply(this.postMatrixs[targetIndex]);

                    if (this.anchors[i].css) m.multiply(cssScaleDownMatrix);

                    this.anchors[i].group.matrix = m;
                  }

                  if (this.anchors[i].visible && !worldMatrix) {
                    this.anchors[i].visible = false;

                    this.anchors[i].onTargetLost?.();
                  }

                  if (!this.anchors[i].visible && worldMatrix) {
                    this.anchors[i].visible = true;

                    this.anchors[i].onTargetFound?.();
                  }

                  if (worldMatrix) this.ui.hideScanning();
                }
              }
              break;
          }
        },
      });

      this.resize();

      const { dimensions: imageTargetDimensions } = await this.controller.addImageTargets(
        this.imageTargetSrc
      );

      this.postMatrixs = [];

      for (let i = 0; i < imageTargetDimensions.length; i++) {
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        const [markerWidth, markerHeight] = imageTargetDimensions[i];
        position.x = markerWidth / 2;
        position.y = markerWidth / 2 + (markerHeight - markerWidth) / 2;
        scale.x = markerWidth;
        scale.y = markerWidth;
        scale.z = markerWidth;

        const postMatrix = new THREE.Matrix4();
        postMatrix.compose(position, quaternion, scale);
        this.postMatrixs.push(postMatrix);
      }

      await this.controller.dummyRun(this.video);

      this.ui.hideLoading();
      this.ui.showScanning();

      this.controller.processVideo(this.video);
      resolve();
    });
  }

  resize() {
    const { renderer, cssRenderer, camera, container, video, controller } = this;
    if (!video || !controller) return;

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

    const proj = controller.getProjectionMatrix();
    const fov = (2 * Math.atan((1 / proj[5] / vh) * container.clientHeight) * 180) / Math.PI; // vertical fov
    const near = proj[14] / (proj[10] - 1.0);
    const far = proj[14] / (proj[10] + 1.0);
    camera.fov = fov;
    camera.near = near;
    camera.far = far;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    video.style.top = -(vh - container.clientHeight) / 2 + 'px';
    video.style.left = -(vw - container.clientWidth) / 2 + 'px';
    video.style.width = vw + 'px';
    video.style.height = vh + 'px';

    const canvas = renderer.domElement as HTMLCanvasElement;
    const cssCanvas = cssRenderer.domElement;

    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = container.clientWidth + 'px';
    canvas.style.height = container.clientHeight + 'px';

    cssCanvas.style.position = 'absolute';
    cssCanvas.style.left = '0';
    cssCanvas.style.top = '0';
    cssCanvas.style.width = container.clientWidth + 'px';
    cssCanvas.style.height = container.clientHeight + 'px';

    renderer.setSize(container.clientWidth, container.clientHeight);
    cssRenderer.setSize(container.clientWidth, container.clientHeight);
  }
}

if (!window.MINDAR.IMAGE.MindARThree)
  window.MINDAR.IMAGE.MindARThree = MindARThree as typeof window.MINDAR.IMAGE.MindARThree;
if (!window.MINDAR.IMAGE.THREE) window.MINDAR.IMAGE.THREE = THREE;

export default MindARThree;
