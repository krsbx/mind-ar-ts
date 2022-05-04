import * as ICompiler from './compiler';
import * as IController from './controller';
import * as IEstimation from './estimation';
import * as IMatching from './matching';
import * as ITracker from './tracker';

interface ControllerConstructor {
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

interface ThreeConstructor {
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

interface IAnchor {
  group: THREE.Group;
  targetIndex: number;
  onTargetFound: (() => void) | null;
  onTargetLost: (() => void) | null;
  css: boolean;
  visible: boolean;
}

export type {
  ICompiler,
  IController,
  IEstimation,
  IMatching,
  ITracker,
  ControllerConstructor,
  ThreeConstructor,
  IAnchor,
};
