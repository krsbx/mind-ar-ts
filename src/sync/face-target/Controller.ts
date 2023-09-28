import { InputImage } from '@mediapipe/face_mesh';
import { DEFAULT_FILTER_BETA, DEFAULT_FILTER_CUTOFF } from '../../face-target/utils/constant';
import OneEuroFilter from '../libs/OneEuroFilter';
import FaceMesh from './FaceMesh';
import FaceGeometry from './face-geometry/FaceGeometry';
import Estimator from './face-geometry/estimator';
import { positions as canonicalMetricLandmarks } from './face-geometry/face-data';

type EstimateResult = ReturnType<Estimator['estimate']>;
type OnUpdateArgs = {
  hasFace?: boolean;
  estimateResult?: EstimateResult;
};

class Controller {
  private estimator: Estimator | null;
  private lastEstimateResult: EstimateResult | null;
  private filterMinCF: number;
  private filterBeta: number;
  private customFaceGeometries: FaceGeometry[];
  private landmarkFilters: OneEuroFilter[];
  public onUpdate: (value: OnUpdateArgs) => void;
  private faceMatrixFilter: OneEuroFilter;
  private faceScaleFilter: OneEuroFilter;
  private faceMesh: FaceMesh | null;
  private processingVideo: boolean;

  constructor({
    filterBeta,
    filterMinCF,
    onUpdate = () => {},
  }: {
    filterMinCF: number | null;
    filterBeta: number | null;
    onUpdate: (value: OnUpdateArgs) => void;
  }) {
    this.customFaceGeometries = [];
    this.estimator = null;
    this.lastEstimateResult = null;
    this.filterMinCF = filterMinCF === null ? DEFAULT_FILTER_CUTOFF : filterMinCF;
    this.filterBeta = filterBeta === null ? DEFAULT_FILTER_BETA : filterBeta;
    this.onUpdate = onUpdate;
    this.faceMesh = null;
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

  setup(input: InputImage) {
    this.faceMesh = new FaceMesh();
    this.estimator = new Estimator(input);
  }

  onInputResized(input: InputImage) {
    this.estimator = new Estimator(input);
  }

  getCameraParams() {
    const obj = {
      fov: 0,
      aspect: 0,
      near: 0,
      far: 0,
    };

    if (this.estimator) {
      obj.fov = (this.estimator.fov * 180) / Math.PI;
      obj.aspect = this.estimator.frameWidth / this.estimator.frameHeight;
      obj.near = this.estimator.near;
      obj.far = this.estimator.far;
    }

    return obj;
  }

  async dummyRun(input: InputImage) {
    await this.faceMesh?.detect?.(input);
  }

  #updateEstimateResult(estimateResult: EstimateResult) {
    const lastMetricLandmarks = this.lastEstimateResult?.metricLandmarks;

    if (!lastMetricLandmarks) return;

    const metricLandmarks = [];

    for (let i = 0; i < lastMetricLandmarks.length; i++) {
      metricLandmarks[i] = this.landmarkFilters[i].filter(
        Date.now(),
        estimateResult.metricLandmarks[i]
      );
    }

    const faceMatrix = this.faceMatrixFilter.filter(Date.now(), estimateResult.faceMatrix);
    const faceScale = this.faceScaleFilter.filter(Date.now(), [estimateResult.faceScale]);

    this.lastEstimateResult = {
      faceScale: faceScale[0],
      metricLandmarks,
      faceMatrix,
    };
  }

  async #doFaceDetection(input: InputImage) {
    if (!this.faceMesh) return;

    const results = await this.faceMesh.detect(input);

    if (!results.multiFaceLandmarks.length) {
      this.lastEstimateResult = null;
      this.onUpdate({ hasFace: false });

      for (let i = 0; i < this.landmarkFilters.length; i++) {
        this.landmarkFilters[i].reset();
      }

      this.faceMatrixFilter.reset();
      this.faceScaleFilter.reset();

      return;
    }

    if (!this.estimator) return;

    const landmarks = results.multiFaceLandmarks[0].map((l) => [l.x, l.y, l.z]);

    const estimateResult = this.estimator.estimate(landmarks);

    if (this.lastEstimateResult === null) {
      this.lastEstimateResult = estimateResult;
    } else {
      this.#updateEstimateResult(estimateResult);
    }

    this.onUpdate({ hasFace: true, estimateResult: this.lastEstimateResult });

    for (const customFaceGeometry of this.customFaceGeometries) {
      customFaceGeometry.updatePositions(estimateResult.metricLandmarks);
    }
  }

  #doVideoProcessing(input: InputImage) {
    const processingVideo = this.processingVideo;
    const doFaceDetection = this.#doFaceDetection.bind(this);

    return async function (this: () => Promise<void>) {
      if (!processingVideo) return;

      await doFaceDetection(input);

      window.requestAnimationFrame(this);
    };
  }

  processVideo(input: InputImage) {
    if (this.processingVideo) return;

    this.processingVideo = true;

    window.requestAnimationFrame(this.#doVideoProcessing(input));
  }

  stopProcessVideo() {
    this.processingVideo = false;
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

export default Controller;
