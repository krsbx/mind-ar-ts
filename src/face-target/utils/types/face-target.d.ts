import { Estimator } from '../../face-geometry/estimator';

type EstimateResult = ReturnType<Estimator['estimate']>;

interface IOnUpdateArgs {
  hasFace?: boolean;
  estimateResult?: EstimateResult;
}

interface ThreeConstructor {
  container: HTMLDivElement;
  uiLoading?: string;
  uiScanning?: string;
  uiError?: string;
  filterMinCF?: number | null;
  filterBeta?: number | null;
  shouldFaceUser?: boolean;
}

interface IAnchor {
  group: THREE.Group;
  landmarkIndex: number;
  css: boolean;
}

export type { ThreeConstructor, IAnchor, EstimateResult, IOnUpdateArgs };
