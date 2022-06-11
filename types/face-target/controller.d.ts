import FaceGeometry from './face-geometry/face-geometry';
import { IOnUpdateArgs } from '../../face-target/utils/types/face-target';

declare class Controller {
  private estimator;
  private lastEstimateResult;
  private filterMinCF;
  private filterBeta;
  private customFaceGeometries;
  private landmarkFilters;
  onUpdate?: ((value: IOnUpdateArgs) => void) | null;
  private faceMatrixFilter;
  private faceScaleFilter;
  private faceMeshHelper;
  private processingVideo;
  constructor({
    filterBeta,
    filterMinCF,
    onUpdate,
  }: {
    filterMinCF: number | null;
    filterBeta: number | null;
    onUpdate?: ((value: IOnUpdateArgs) => void) | null;
  });
  setup(input: { height: number; width: number }): Promise<void>;
  getCameraParams():
    | {
        fov?: undefined;
        aspect?: undefined;
        near?: undefined;
        far?: undefined;
      }
    | {
        fov: number;
        aspect: number;
        near: number;
        far: number;
      };
  dummyRun(input: HTMLVideoElement): Promise<void>;
  private _onNoMultiFaceLandmarks;
  private _updateEstimateResult;
  private _doFaceDetection;
  private _doVideoProcessing;
  processVideo(input: HTMLVideoElement): void;
  stopProcessVideo(): void;
  createThreeFaceGeometry(): FaceGeometry;
  getLandmarkMatrix(landmarkIndex: number): any[] | null;
}

export default Controller;
