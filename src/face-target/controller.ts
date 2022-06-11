import FaceMeshHelper from './face-mesh-helper';
import Estimator from './face-geometry/estimator';
import FaceGeometry from './face-geometry/face-geometry';
import { positions as canonicalMetricLandmarks } from './face-geometry/face-data';
import { OneEuroFilter } from '../libs';
import { DEFAULT_FILTER_BETA, DEFAULT_FILTER_CUTOFF } from './utils/constant';
import { EstimateResult, IOnUpdateArgs } from './utils/types/face-target';

class Controller {
  private estimator: Estimator | null;
  private lastEstimateResult: EstimateResult | null;
  private filterMinCF: number;
  private filterBeta: number;
  private customFaceGeometries: FaceGeometry[];
  private landmarkFilters: OneEuroFilter[];
  public onUpdate?: ((value: IOnUpdateArgs) => void) | null;
  private faceMatrixFilter: OneEuroFilter;
  private faceScaleFilter: OneEuroFilter;
  private faceMeshHelper: FaceMeshHelper | null;
  private processingVideo: boolean;

  constructor({
    filterBeta,
    filterMinCF,
    onUpdate = null,
  }: {
    filterMinCF: number | null;
    filterBeta: number | null;
    onUpdate?: ((value: IOnUpdateArgs) => void) | null;
  }) {
    this.customFaceGeometries = [];
    this.estimator = null;
    this.lastEstimateResult = null;
    this.filterMinCF = filterMinCF === null ? DEFAULT_FILTER_CUTOFF : filterMinCF;
    this.filterBeta = filterBeta === null ? DEFAULT_FILTER_BETA : filterBeta;
    this.onUpdate = onUpdate;
    this.faceMeshHelper = null;
    this.processingVideo = false;

    this.landmarkFilters = [];

    for (let i = 0; i < canonicalMetricLandmarks.length; i++) {
      this.landmarkFilters[i] = new OneEuroFilter({
        minCutOff: this.filterMinCF,
        beta: this.filterBeta,
      });
    }

    this.faceMatrixFilter = new OneEuroFilter({
      minCutOff: this.filterMinCF,
      beta: this.filterBeta,
    });

    this.faceScaleFilter = new OneEuroFilter({
      minCutOff: this.filterMinCF,
      beta: this.filterBeta,
    });
  }

  public async setup(input: { height: number; width: number }) {
    this.faceMeshHelper = new FaceMeshHelper();
    this.estimator = new Estimator(input);
  }

  public getCameraParams() {
    if (!this.estimator) return {};

    return {
      fov: (this.estimator.fov * 180) / Math.PI,
      aspect: this.estimator.frameWidth / this.estimator.frameHeight,
      near: this.estimator.near,
      far: this.estimator.far,
    };
  }

  public async dummyRun(input: HTMLVideoElement) {
    await this.faceMeshHelper?.detect(input);
  }

  private _onNoMultiFaceLandmarks() {
    this.lastEstimateResult = null;
    this.onUpdate?.({ hasFace: false });

    for (const landmarkFilter of this.landmarkFilters) {
      landmarkFilter?.reset();
    }

    this.faceMatrixFilter.reset();
    this.faceScaleFilter.reset();
  }

  private _updateEstimateResult(estimateResult: EstimateResult) {
    const lastMetricLandmarks = this.lastEstimateResult?.metricLandmarks ?? null;

    if (!lastMetricLandmarks) return;

    const metricLandmarks = [];

    for (const [i, landMarkFilter] of this.landmarkFilters.entries()) {
      metricLandmarks[i] = landMarkFilter.filter(Date.now(), estimateResult.metricLandmarks[i]);
    }

    const faceMatrix = this.faceMatrixFilter.filter(Date.now(), estimateResult.faceMatrix);

    const faceScale = this.faceScaleFilter.filter(Date.now(), [estimateResult.faceScale]);

    this.lastEstimateResult = {
      faceScale: faceScale[0],
      metricLandmarks,
      faceMatrix,
    };
  }

  private async _doFaceDetection(input: HTMLVideoElement) {
    const results = await this.faceMeshHelper?.detect(input);

    if (!results) return;

    if (results.multiFaceLandmarks.length === 0) {
      this._onNoMultiFaceLandmarks();

      return;
    }

    const landmarks = results.multiFaceLandmarks[0].map((l) => [l.x, l.y, l.z]);

    const estimateResult = this.estimator?.estimate(landmarks) ?? null;

    if (!this.lastEstimateResult || !estimateResult) {
      this.lastEstimateResult = estimateResult;
      return;
    }

    this._updateEstimateResult(estimateResult);

    this.onUpdate?.({ hasFace: true, estimateResult: this.lastEstimateResult });

    for (const customFaceGeometry of this.customFaceGeometries) {
      customFaceGeometry.updatePositions(estimateResult.metricLandmarks);
    }
  }

  private _doVideoProcessing(input: HTMLVideoElement) {
    return async () => {
      if (!this.processingVideo) return;

      await this._doFaceDetection(input);

      if (this.processingVideo) {
        window.requestAnimationFrame(this._doVideoProcessing(input));
      }
    };
  }

  public processVideo(input: HTMLVideoElement) {
    if (this.processingVideo) return;

    this.processingVideo = true;

    window.requestAnimationFrame(this._doVideoProcessing(input));
  }

  public stopProcessVideo() {
    this.processingVideo = false;
  }

  public createThreeFaceGeometry() {
    const faceGeometry = new FaceGeometry();
    this.customFaceGeometries.push(faceGeometry);

    return faceGeometry;
  }

  public getLandmarkMatrix(landmarkIndex: number) {
    if (!this.lastEstimateResult) return null;

    const { metricLandmarks, faceMatrix, faceScale } = this.lastEstimateResult;

    // final matrix = faceMatrix x landmarkMatrix
    // landmarkMatrix = [
    //   faceScale, 0, 0, metricLandmarks[landmarkIndex][0],
    //   0, faceScale, 0, metricLandmarks[landmarkIndex][1],
    //   0, 0, faceScale, metricLandmarks[landmarkIndex][2],
    //   0, 0, 0, 1
    // ]
    const fm = faceMatrix;
    const s = faceScale;

    const t = [
      metricLandmarks[landmarkIndex][0],
      metricLandmarks[landmarkIndex][1],
      metricLandmarks[landmarkIndex][2],
    ];

    const m = [
      fm[0] * s,
      fm[1] * s,
      fm[2] * s,
      fm[0] * t[0] + fm[1] * t[1] + fm[2] * t[2] + fm[3],
      fm[4] * s,
      fm[5] * s,
      fm[6] * s,
      fm[4] * t[0] + fm[5] * t[1] + fm[6] * t[2] + fm[7],
      fm[8] * s,
      fm[9] * s,
      fm[10] * s,
      fm[8] * t[0] + fm[9] * t[1] + fm[10] * t[2] + fm[11],
      fm[12] * s,
      fm[13] * s,
      fm[14] * s,
      fm[12] * t[0] + fm[13] * t[1] + fm[14] * t[2] + fm[15],
    ];

    return m;
  }
}

export default Controller;
