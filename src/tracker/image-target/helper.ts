import { TEMPLATE_SIZE } from './constant';
import { IOptions, ISimiliarityOptions, ITemplateOptions } from './interface';

// compute variances of the pixels, centered at (cx, cy)
const templateVar = ({
  image,
  cx,
  cy,
  sdThresh,
  imageDataCumsum,
  imageDataSqrCumsum,
}: ITemplateOptions) => {
  if (cx - TEMPLATE_SIZE < 0 || cx + TEMPLATE_SIZE >= image.width) return null;
  if (cy - TEMPLATE_SIZE < 0 || cy + TEMPLATE_SIZE >= image.height) return null;

  const templateWidth = 2 * TEMPLATE_SIZE + 1;
  const nPixels = templateWidth * templateWidth;

  let average = imageDataCumsum.query(
    cx - TEMPLATE_SIZE,
    cy - TEMPLATE_SIZE,
    cx + TEMPLATE_SIZE,
    cy + TEMPLATE_SIZE
  );
  average /= nPixels;

  //v = sum((pixel_i - avg)^2) for all pixel i within the template
  //  = sum(pixel_i^2) - sum(2 * avg * pixel_i) + sum(avg^avg)

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
  vlen += nPixels * average * average;

  if (vlen / nPixels < sdThresh * sdThresh) return null;
  vlen = Math.sqrt(vlen);

  return vlen;
};

const getSimilarity = (options: ISimiliarityOptions) => {
  const { image, cx, cy, vlen, tx, ty, imageDataCumsum, imageDataSqrCumsum } = options;
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

  // !! This loop is the performance bottleneck. Use moving pointers to optimize
  //
  //   for (let i = cx - templateSize, i2 = tx - templateSize; i <= cx + templateSize; i++, i2++) {
  //     for (let j = cy - templateSize, j2 = ty - templateSize; j <= cy + templateSize; j++, j2++) {
  //       sxy += imageData[j*width + i] * imageData[j2*width + i2];
  //     }
  //   }
  //

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

  let templateAverage = imageDataCumsum.query(
    tx - templateSize,
    ty - templateSize,
    tx + templateSize,
    ty + templateSize
  );
  templateAverage /= templateWidth * templateWidth;
  sxy -= templateAverage * sx;

  let vlen2 = sxx - (sx * sx) / (templateWidth * templateWidth);
  if (vlen2 == 0) return null;
  vlen2 = Math.sqrt(vlen2);

  // covariance between template and current pixel
  const sim = (1.0 * sxy) / (vlen * vlen2);
  return sim;
};

const selectFeature = (options: IOptions) => {
  const {
    image,
    featureMap,
    templateSize,
    searchSize,
    occSize,
    maxSimThresh,
    minSimThresh,
    sdThresh,
    imageDataCumsum,
    imageDataSqrCumsum,
  } = options;

  const { data: imageData, width, height } = image;

  const newOccSize = Math.floor(Math.min(image.width, image.height) / 10);

  const divSize = (templateSize * 2 + 1) * 3;
  const xDiv = Math.floor(width / divSize);
  const yDiv = Math.floor(height / divSize);

  const maxFeatureNum =
    Math.floor(width / newOccSize) * Math.floor(height / newOccSize) + xDiv * yDiv;

  const coords = [];
  const image2 = new Float32Array(imageData.length);
  for (let i = 0; i < image2.length; i++) {
    image2[i] = featureMap[i];
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
      cx,
      cy,
      sdThresh: 0,
      imageDataCumsum,
      imageDataSqrCumsum,
    });

    if (!vlen) {
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

        if (!sim) continue;

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

export { selectFeature, templateVar, getSimilarity };
