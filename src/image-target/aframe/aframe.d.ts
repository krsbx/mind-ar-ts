export interface IMindARImage {
  imageTargetSrc: string;
  maxTrack: number;
  filterMinCF: number;
  filterBeta: number;
  missTolerance: number;
  warmupTolerance: number;
  showStats: boolean;
  autoStart: boolean;
  uiLoading: string;
  uiScanning: string;
  uiError: string;
  reshowScanning: boolean;
  shouldFaceUser: boolean;
}

export interface IMindARImageTarget {
  targetIndex: number;
}
