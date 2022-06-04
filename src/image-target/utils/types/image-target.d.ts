export interface ControllerConstructor {
  inputWidth: number;
  inputHeight: number;
  onUpdate?: ((data: IOnUpdate) => void) | null;
  debugMode?: boolean;
  maxTrack?: number;
  warmupTolerance?: number | null;
  missTolerance?: number | null;
  filterMinCF?: number | null;
  filterBeta?: number | null;
}

export interface ThreeConstructor {
  container: HTMLDivElement;
  imageTargetSrc: string;
  maxTrack: number;
  uiLoading?: string;
  uiScanning?: string;
  uiError?: string;
  filterMinCF?: number | null;
  filterBeta?: number | null;
  warmupTolerance?: number | null;
  missTolerance?: number | null;
}

export interface IAnchor {
  group: THREE.Group;
  targetIndex: number;
  onTargetFound: (() => void) | null;
  onTargetLost: (() => void) | null;
  css: boolean;
  visible: boolean;
}
