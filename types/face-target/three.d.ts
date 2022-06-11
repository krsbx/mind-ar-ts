import * as THREE from 'three';
import { IOnUpdateArgs, ThreeConstructor } from '../../face-target/utils/types/face-target';

declare class MindARThree {
  private container;
  private video;
  private ui;
  private controller;
  private scene;
  private cssScene;
  private renderer;
  private cssRenderer;
  private camera;
  private shouldFaceUser;
  private anchors;
  private faceMeshes;
  constructor({
    container,
    uiLoading,
    uiScanning,
    uiError,
    filterMinCF,
    filterBeta,
    shouldFaceUser,
  }: ThreeConstructor);
  start(): Promise<void>;
  stop(): void;
  reInitialize(): void;
  switchCamera(): void;
  addFaceMesh(): THREE.Mesh<
    import('./face-geometry/face-geometry').default,
    THREE.MeshStandardMaterial
  >;
  addAnchor(landmarkIndex: number): {
    group: THREE.Group;
    landmarkIndex: number;
    css: boolean;
  };
  addCSSAnchor(landmarkIndex: number): {
    group: THREE.Group;
    landmarkIndex: number;
    css: boolean;
  };
  _startVideo(): Promise<void>;
  _onARUpdate({ hasFace, estimateResult }: IOnUpdateArgs): void;
  private _setCameraParams;
  _startAR(): Promise<void>;
  _resize(): void;
}

export default MindARThree;
