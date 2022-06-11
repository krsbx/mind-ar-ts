import * as THREE from 'three';
import { ThreeConstructor } from '../../image-target/utils/types/image-target';

declare class MindARThree {
  private container;
  private imageTargetSrc;
  private maxTrack;
  private filterMinCF;
  private filterBeta;
  private warmupTolerance;
  private missTolerance;
  private ui;
  private scene;
  private cssScene;
  private renderer;
  private cssRenderer;
  private camera;
  private anchors;
  private controller;
  private video;
  private postMatrixs;
  constructor({
    container,
    imageTargetSrc,
    maxTrack,
    uiLoading,
    uiScanning,
    uiError,
    filterMinCF,
    filterBeta,
    warmupTolerance,
    missTolerance,
  }: ThreeConstructor);
  start(): Promise<void>;
  stop(): void;
  addAnchor(targetIndex: number): {
    group: THREE.Group;
    targetIndex: number;
    onTargetFound: null;
    onTargetLost: null;
    css: boolean;
    visible: boolean;
  };
  addCSSAnchor(targetIndex: number): {
    group: THREE.Group;
    targetIndex: number;
    onTargetFound: null;
    onTargetLost: null;
    css: boolean;
    visible: boolean;
  };
  _startVideo(): Promise<void>;
  _startAR(): Promise<void>;
  resize(): void;
}

export default MindARThree;
