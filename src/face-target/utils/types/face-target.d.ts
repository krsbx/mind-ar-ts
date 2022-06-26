import Estimator from '../../face-geometry/estimator';

export type EstimateResult = ReturnType<Estimator['estimate']>;

export interface IOnUpdateArgs {
  hasFace?: boolean;
  estimateResult?: EstimateResult;
}

export interface ThreeConstructor {
  container: HTMLDivElement;
  uiLoading?: string;
  uiScanning?: string;
  uiError?: string;
  filterMinCF?: number | null;
  filterBeta?: number | null;
  shouldFaceUser?: boolean;
}

export interface IAnchor {
  group: THREE.Group;
  landmarkIndex: number;
  css: boolean;
}

export type Matrix4Args = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];
