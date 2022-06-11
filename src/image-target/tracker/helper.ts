import { IOptions, ISimiliarityOptions, ITemplateOptions } from '../utils/types/tracker';
import { TEMPLATE_SIZE } from '../utils/constant/tracker';

export const templateVar = (options: ITemplateOptions) => {
  const { cx, cy, image, imageDataCumsum, imageDataSqrCumsum, sdThresh } = options;

  if (cx - TEMPLATE_SIZE < 0 || cx + TEMPLATE_SIZE >= image.width) return null;
  if (cy - TEMPLATE_SIZE < 0 || cy + TEMPLATE_SIZE >= image.height) return null;

  const templateWidth = 2 * TEMPLATE_SIZE + 1;
  const nPixels = templateWidth ** 2;

  const average =
    imageDataCumsum.query(
      cx - TEMPLATE_SIZE,
      cy - TEMPLATE_SIZE,
      cx + TEMPLATE_SIZE,
      cy + TEMPLATE_SIZE
    ) / nPixels;

  let vlen = imageDataSqrCumsum.query(
    cx - TEMPLATE_SIZE,
    cy - TEMPLATE_SIZE,
    cx + TEMPLATE_SIZE,
    cy + TEMPLATE_SIZE
  );

  vlen -=
    2 *
    average *
    imageDataCumsum.query(
      cx - TEMPLATE_SIZE,
      cy - TEMPLATE_SIZE,
      cx + TEMPLATE_SIZE,
      cy + TEMPLATE_SIZE
    );

  vlen += nPixels * average ** 2;

  if (vlen / nPixels < sdThresh * sdThresh) return null;

  vlen = Math.sqrt(vlen);
  return vlen;
};

export const getSimilarity = (options: ISimiliarityOptions) => {
  const { cx, cy, image, imageDataCumsum, imageDataSqrCumsum, tx, ty, vlen } = options;

  const { data: imageData, width, height } = image;
  const templateSize = TEMPLATE_SIZE;

  if (cx - templateSize < 0 || cx + templateSize >= width) return null;
  if (cy - templateSize < 0 || cy + templateSize >= height) return null;

  const templateWidth = 2 * templateSize + 1;

  const sx = imageDataCumsum.query(
    cx - templateSize,
    cy - templateSize,
    cx + templateSize,
    cy + templateSize
  );

  const sxx = imageDataSqrCumsum.query(
    cx - templateSize,
    cy - templateSize,
    cx + templateSize,
    cy + templateSize
  );

  let sxy = 0;

  let p1 = (cy - templateSize) * width + (cx - templateSize);
  let p2 = (ty - templateSize) * width + (tx - templateSize);

  const nextRowOffset = width - templateWidth;

  for (let j = 0; j < templateWidth; j++) {
    for (let i = 0; i < templateWidth; i++) {
      sxy += imageData[p1] * imageData[p2];

      p1 += 1;
      p2 += 1;
    }

    p1 += nextRowOffset;
    p2 += nextRowOffset;
  }

  const templateAverage =
    imageDataCumsum.query(
      tx - templateSize,
      ty - templateSize,
      tx + templateSize,
      ty + templateSize
    ) /
    templateWidth ** 2;

  sxy -= templateAverage * sx;

  let vlen2 = sxx - (sx * sx) / (templateWidth * templateWidth);

  if (vlen2 == 0) return null;
  vlen2 = Math.sqrt(vlen2);

  // covariance between template and current pixel
  const sim = (1.0 * sxy) / (vlen * vlen2);
  return sim;
};

export const selectFeature = (options: IOptions) => {
  const {
    image,
    featureMap,
    templateSize,
    searchSize,
    maxSimThresh,
    minSimThresh,
    sdThresh,
    imageDataCumsum,
    imageDataSqrCumsum,
  } = options;

  let { occSize } = options;

  const { data: imageData, width, height } = image;

  occSize = Math.floor(Math.min(image.width, image.height) / 10);

  const divSize = (templateSize * 2 + 1) * 3;
  const xDiv = Math.floor(width / divSize);
  const yDiv = Math.floor(height / divSize);

  const maxFeatureNum = Math.floor(width / occSize) * Math.floor(height / occSize) + xDiv * yDiv;

  const coords = [];
  const image2 = new Float32Array(imageData.length);

  for (const [i, feature] of featureMap.entries()) {
    image2[i] = feature;
  }

  let num = 0;

  while (num < maxFeatureNum) {
    let minSim = maxSimThresh;
    let cx = -1;
    let cy = -1;

    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        if (image2[j * width + i] < minSim) {
          minSim = image2[j * width + i];
          cx = i;
          cy = j;
        }
      }
    }

    if (cx === -1) break;

    const vlen = templateVar({
      image,
      cx: cx,
      cy: cy,
      sdThresh: 0,
      imageDataCumsum,
      imageDataSqrCumsum,
    });

    if (vlen === null) {
      image2[cy * width + cx] = 1.0;
      continue;
    }

    if (vlen / (templateSize * 2 + 1) < sdThresh) {
      image2[cy * width + cx] = 1.0;
      continue;
    }

    let min = 1.0;
    let max = -1.0;

    for (let j = -searchSize; j <= searchSize; j++) {
      for (let i = -searchSize; i <= searchSize; i++) {
        if (i * i + j * j > searchSize * searchSize) continue;
        if (i === 0 && j === 0) continue;

        const sim = getSimilarity({
          image,
          vlen,
          cx: cx + i,
          cy: cy + j,
          tx: cx,
          ty: cy,
          imageDataCumsum,
          imageDataSqrCumsum,
        });

        if (sim === null) continue;

        if (sim < min) {
          min = sim;

          if (min < minSimThresh && min < minSim) break;
        }

        if (sim > max) {
          max = sim;

          if (max > 0.99) break;
        }
      }

      if ((min < minSimThresh && min < minSim) || max > 0.99) break;
    }

    if ((min < minSimThresh && min < minSim) || max > 0.99) {
      image2[cy * width + cx] = 1.0;
      continue;
    }

    coords.push({ x: cx, y: cy });

    num += 1;

    // no other feature points within occSize square
    for (let j = -occSize; j <= occSize; j++) {
      for (let i = -occSize; i <= occSize; i++) {
        if (cy + j < 0 || cy + j >= height || cx + i < 0 || cx + i >= width) continue;

        image2[(cy + j) * width + (cx + i)] = 1.0;
      }
    }
  }

  return coords;
};
