import UI from '../ui';

export interface IImageSetupParams {
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
  _positionSettings?: string;
  _positionZIndex?: number;
}

export interface IImageTarget {
  el: typeof Entity;
  postMatrix: THREE.Matrix4;
  data: {
    targetIndex: number;
  };

  setupMarker: ([markerWidth, markerHeight]: number[]) => void;
  updateWorldMatrix: (worldMatrix?: number[] | null) => void;
}

export interface IMindARImageSystem {
  container: HTMLDivElement;
  video: HTMLVideoElement;
  anchorEntities: { el: IImageTarget; targetIndex: number }[];
  imageTargetSrc: string;
  maxTrack: number;
  filterMinCF: number;
  filterBeta: number;
  missTolerance: number;
  warmupTolerance: number;
  showStats: false;
  controller: ImageController;
  ui: UI;
  el: typeof Entity;
  mainStats: Stats;
  reshowScanning: boolean;
  shouldFaceUser: boolean;

  _positionSettings: string;
  _positionZIndex: number;

  setup: (params: IImageSetupParams) => void;
  registerAnchor: (el: IImageTarget, targetIndex: number) => void;
  start: () => void;
  switchTarget: (targetIndex: number) => void;
  stop: () => void;
  switchCamera: () => void;
  pause: (keepVideo: boolean) => void;
  unpause: () => void;
}
