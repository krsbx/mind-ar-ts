// Ref: https://jaantollander.com/post/noise-filtering-using-one-euro-filter/#mjx-eqn%3A1

const smoothingFactor = (te: number, cutoff: number) => {
  const r = 2 * Math.PI * cutoff * te;

  return r / (r + 1);
};

const exponentialSmoothing = (a: number, x: number, xPrev: number) => a * x + (1 - a) * xPrev;

class OneEuroFilter {
  private minCutOff: number;
  private beta: number;
  private dCutOff: number;
  private xPrev: number[] | null;
  private dxPrev: number[] | null;
  private tPrev: number | null;
  private initialized: boolean;

  constructor({ minCutOff, beta }: { minCutOff: number; beta: number }) {
    this.minCutOff = minCutOff;
    this.beta = beta;
    this.dCutOff = 0.001; // period in milliseconds, so default to 0.001 = 1Hz

    this.xPrev = null;
    this.dxPrev = null;
    this.tPrev = null;
    this.initialized = false;
  }

  reset() {
    this.initialized = false;
  }

  filter(t: number, x: number[]) {
    if (!this.initialized || !this.tPrev || !this.dxPrev || !this.xPrev) {
      this.initialized = true;
      this.xPrev = x;
      this.dxPrev = x.map(() => 0);
      this.tPrev = t;

      return x;
    }

    const { xPrev, tPrev, dxPrev } = this;

    const te = t - tPrev;

    const ad = smoothingFactor(te, this.dCutOff);

    const dx: number[] = [];
    const dxHat: number[] = [];
    const xHat: number[] = [];

    for (let i = 0; i < x.length; i++) {
      // The filtered derivative of the signal.
      dx[i] = (x[i] - xPrev[i]) / te;
      dxHat[i] = exponentialSmoothing(ad, dx[i], dxPrev[i]);

      // The filtered signal
      const cutOff = this.minCutOff + this.beta * Math.abs(dxHat[i]);
      const a = smoothingFactor(te, cutOff);
      xHat[i] = exponentialSmoothing(a, x[i], xPrev[i]);
    }

    // update prev
    this.xPrev = xHat;
    this.dxPrev = dxHat;
    this.tPrev = t;

    return xHat;
  }
}

export default OneEuroFilter;
