import { InputImage } from '@mediapipe/face_mesh';
import { FaceMeshHelper } from './face-mesh-helper';
import { OneEuroFilter } from '../libs';
import { Estimator } from './face-geometry/estimator';
import { _createThreeFaceGeometry } from './face-geometry/face-geometry';
import { positions as canonicalMetricLandmarks } from './face-geometry/face-data';
import { DEFAULT_FILTER_BETA, DEFAULT_FILTER_CUTOFF } from './utils/constant';
import { EstimateResult, IOnUpdateArgs } from './utils/types/face-target';

class Controller {
  private estimator!: Estimator;
  private lastEstimateResult: EstimateResult | null;
  private filterMinCF: number;
  private filterBeta: number;
  private customFaceGeometries: ReturnType<typeof _createThreeFaceGeometry>[];
  private landmarkFilters: OneEuroFilter[];
  public onUpdate?: ((value: IOnUpdateArgs) => void) | null;
  private faceMatrixFilter: OneEuroFilter;
  private faceScaleFilter: OneEuroFilter;
  private faceMeshHelper!: FaceMeshHelper;
  private processingVideo: boolean;

  constructor({
    filterMinCF,
    filterBeta,
    onUpdate = null,
  }: {
    filterMinCF: number | null;
    filterBeta: number | null;
    onUpdate?: ((value: IOnUpdateArgs) => void) | null;
  }) {
    this.processingVideo = false;
    this.landmarkFilters = [];
    this.customFaceGeometries = [];
    this.lastEstimateResult = null;
    this.filterMinCF = !filterMinCF ? DEFAULT_FILTER_CUTOFF : filterMinCF;
    this.filterBeta = !filterBeta ? DEFAULT_FILTER_BETA : filterBeta;
    this.onUpdate = onUpdate;

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

  async setup(input: { height: number; width: number }) {
    this.faceMeshHelper = new FaceMeshHelper();
    this.estimator = new Estimator(input);
  }

  getCameraParams() {
    return {
      fov: (this.estimator.fov * 180) / Math.PI,
      aspect: this.estimator.frameWidth / this.estimator.frameHeight,
      near: this.estimator.near,
      far: this.estimator.far,
    };
  }

  // Dummy run for warming up
  async dummyRun(input: InputImage) {
    await this.faceMeshHelper.detect(input);
  }

  resetFilters() {
    this.lastEstimateResult = null;
    this.onUpdate?.({ hasFace: false });

    // Reset any active filters
    for (let i = 0; i < this.landmarkFilters.length; i++) {
      this.landmarkFilters[i].reset();
    }

    this.faceMatrixFilter.reset();
    this.faceScaleFilter.reset();
  }

  getEstimatedFilterResults(estimateResult: ReturnType<Estimator['estimate']>) {
    if (!this.lastEstimateResult) return;

    const lastMetricLandmarks = this.lastEstimateResult.metricLandmarks;

    const newMetricLandmarks: number[][] = [];

    for (let i = 0; i < lastMetricLandmarks.length; i++) {
      newMetricLandmarks[i] = this.landmarkFilters[i].filter(
        Date.now(),
        estimateResult.metricLandmarks[i]
      );
    }

    const newFaceMatrix: number[] = this.faceMatrixFilter.filter(
      Date.now(),
      estimateResult.faceMatrix
    );

    const newFaceScale: number[] = this.faceScaleFilter.filter(Date.now(), [
      estimateResult.faceScale,
    ]);

    this.lastEstimateResult = {
      metricLandmarks: newMetricLandmarks,
      faceMatrix: newFaceMatrix,
      faceScale: newFaceScale[0],
    };
  }

  async processFilters(input: InputImage) {
    const results = await this.faceMeshHelper.detect(input);

    if (!results) return;

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;

    const landmarks: number[][] = results.multiFaceLandmarks[0].map((l) => [l.x, l.y, l.z]);

    const estimateResult = this.estimator.estimate(landmarks);

    if (!this.lastEstimateResult) this.lastEstimateResult = estimateResult;
    else {
      this.getEstimatedFilterResults(estimateResult);

      this.onUpdate?.({ hasFace: true, estimateResult: this.lastEstimateResult });

      for (let i = 0; i < this.customFaceGeometries.length; i++)
        this.customFaceGeometries[i].updatePositions(estimateResult.metricLandmarks);
    }
  }

  doVideoProcessing(input: InputImage) {
    return async () => {
      const results = await this.faceMeshHelper.detect(input);

      if (results && results.multiFaceLandmarks && results.multiFaceLandmarks.length === 0)
        this.resetFilters();
      else this.processFilters(input);

      if (this.processingVideo) window.requestAnimationFrame(this.doVideoProcessing(input));
    };
  }

  async processVideo(input: InputImage) {
    if (this.processingVideo) return;

    this.processingVideo = true;

    window.requestAnimationFrame(this.doVideoProcessing(input));
  }

  stopProcessVideo() {
    this.processingVideo = false;
  }

  createThreeFaceGeometry(THREE: typeof AFRAME.THREE) {
    const faceGeometry = _createThreeFaceGeometry(THREE);

    this.customFaceGeometries.push(faceGeometry);

    return faceGeometry;
  }

  getLandmarkMatrix(landmarkIndex: number) {
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

export { Controller };
