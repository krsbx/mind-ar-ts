export interface IMindARFace {
  autoStart: boolean;
  faceOccluder: boolean;
  uiLoading: string;
  uiScanning: string;
  uiError: string;
  filterMinCF: number;
  filterBeta: number;
  shouldFaceUser: boolean;
}

export interface IMindARFaceTarget {
  anchorIndex: number;
}
