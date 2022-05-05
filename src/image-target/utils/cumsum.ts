// fast 2D submatrix sum using cumulative sum algorithm

class CumulativeSum {
  private cumulative: number[][];

  constructor(data: Uint8ClampedArray | number[], width: number, height: number) {
    this.cumulative = [];

    this._createZeroMatrix(width, height);

    this.cumulative[0][0] = data[0];

    this._rowsCumulative(data, width);

    this._columnsCumulative(data, width, height);

    this._generateCumulative(data, width, height);
  }

  private _createZeroMatrix(width: number, height: number) {
    for (let j = 0; j < height; j++) {
      this.cumulative.push([]);

      for (let i = 0; i < width; i++) {
        this.cumulative[j].push(0);
      }
    }
  }

  private _rowsCumulative(data: Uint8ClampedArray | number[], width: number) {
    for (let i = 1; i < width; i++) {
      this.cumulative[0][i] = this.cumulative[0][i - 1] + data[i];
    }
  }

  private _columnsCumulative(data: Uint8ClampedArray | number[], width: number, height: number) {
    for (let j = 1; j < height; j++) {
      this.cumulative[j][0] = this.cumulative[j - 1][0] + data[j * width];
    }
  }

  private _generateCumulative(data: Uint8ClampedArray | number[], width: number, height: number) {
    for (let j = 1; j < height; j++) {
      for (let i = 1; i < width; i++) {
        this.cumulative[j][i] =
          data[j * width + i] +
          this.cumulative[j - 1][i] +
          this.cumulative[j][i - 1] -
          this.cumulative[j - 1][i - 1];
      }
    }
  }

  query(x1: number, y1: number, x2: number, y2: number) {
    let ret = this.cumulative[y2][x2];

    if (y1 > 0) ret -= this.cumulative[y1 - 1][x2];
    if (x1 > 0) ret -= this.cumulative[y2][x1 - 1];
    if (x1 > 0 && y1 > 0) ret += this.cumulative[y1 - 1][x1 - 1];

    return ret;
  }
}

export { CumulativeSum };
