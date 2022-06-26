import UI from '../ui';

export interface IFaceSetupParams {
  uiLoading: string;
  uiScanning: string;
  uiError: string;
  filterMinCF: number;
  filterBeta: number;
  shouldFaceUser: boolean;
  _positionSettings?: string;
  _positionZIndex?: number;
}

export interface IFaceTarget {
  el: typeof Entity;

  data: {
    anchorIndex: number;
  };

  updateVisibility: (visible: boolean) => void;
  updateMatrix: (matrix: number[] | null) => void;
}

export interface IFaceDefaultOccluder {
  el: typeof Entity;

  updateVisibility: (visible: boolean) => void;
  updateMatrix: (matrix: number[] | null) => void;
  addFaceMesh: (faceGeometry: THREE.BufferGeometry) => void;
}

export interface IMindARFaceSystem {
  container: HTMLDivElement;
  video: HTMLVideoElement;
  anchorEntities: { el: IFaceTarget; targetIndex: number }[];
  faceMeshEntities: { el: IFaceDefaultOccluder }[];
  filterMinCF: number;
  filterBeta: number;
  controller: FaceController;
  ui: UI;

  el: typeof Entity;

  shouldFaceUser: true;
  lastHasFace: false;

  setup: (params: IFaceSetupParams) => void;
  registerFaceMesh: (el: IFaceDefaultOccluder) => void;
  registerAnchor: (el: IFaceTarget, targetIndex: number) => void;
  start: () => void;
  stop: () => void;
  switchCamera: () => void;
  pause: (keepVideo: boolean) => void;
  unpause: () => void;
}
