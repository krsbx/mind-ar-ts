import { IBiliear } from './interfaces';

// simpler version of upsampling. better performance
const _upsampleBilinear = ({ image, padOneWidth, padOneHeight }: IBiliear) => {
  const { width, height, data } = image;
  const dstWidth = image.width * 2 + (padOneWidth ? 1 : 0);
  const dstHeight = image.height * 2 + (padOneHeight ? 1 : 0);
  const temp = new Float32Array(dstWidth * dstHeight);

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const v = 0.25 * data[j * width + i];

      const pos = Math.floor(j / 2) * dstWidth + Math.floor(i / 2);
      temp[pos] += v;
      temp[pos + 1] += v;
      temp[pos + dstWidth] += v;
      temp[pos + dstWidth + 1] += v;
    }
  }
  return { data: temp, width: dstWidth, height: dstHeight };
};

// artoolkit version. slower. is it necessary?
const upsampleBilinear = ({ image, padOneWidth, padOneHeight }: IBiliear) => {
  const { width, height, data } = image;

  const dstWidth = image.width * 2 + (padOneWidth ? 1 : 0);
  const dstHeight = image.height * 2 + (padOneHeight ? 1 : 0);

  const temp = new Float32Array(dstWidth * dstHeight);

  for (let i = 0; i < dstWidth; i++) {
    const si = 0.5 * i - 0.25;
    let si0 = Math.floor(si);
    let si1 = Math.ceil(si);
    if (si0 < 0) si0 = 0; // border
    if (si1 >= width) si1 = width - 1; // border

    for (let j = 0; j < dstHeight; j++) {
      const sj = 0.5 * j - 0.25;
      let sj0 = Math.floor(sj);
      let sj1 = Math.ceil(sj);
      if (sj0 < 0) sj0 = 0; // border
      if (sj1 >= height) sj1 = height - 1; //border

      const value =
        (si1 - si) * (sj1 - sj) * data[sj0 * width + si0] +
        (si1 - si) * (sj - sj0) * data[sj1 * width + si0] +
        (si - si0) * (sj1 - sj) * data[sj0 * width + si1] +
        (si - si0) * (sj - sj0) * data[sj1 * width + si1];

      temp[j * dstWidth + i] = value;
    }
  }

  return { data: temp, width: dstWidth, height: dstHeight };
};

export { _upsampleBilinear, upsampleBilinear };
