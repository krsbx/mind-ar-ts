import Cumsum from '../utils/cumsum';
import { ImageDataWithScale } from '../utils/types/compiler';
import {
  MAX_SIM_THRESH,
  MAX_THRESH,
  MIN_THRESH,
  OCCUPANCY_SIZE,
  SD_THRESH,
  SEARCH_SIZE1,
  SEARCH_SIZE2,
  TEMPLATE_SD_THRESH,
  TEMPLATE_SIZE,
} from '../utils/constant/tracker';
import { getSimilarity, selectFeature, templateVar } from './helper';

/*
 * Input image is in grey format. the imageData array size is width * height. value range from 0-255
 * pixel value at row r and c = imageData[r * width + c]
 *
 * @param {Uint8Array} options.imageData
 * @param {int} options.width image width
 * @param {int} options.height image height
 */

const extract = (image: ImageData | ImageDataWithScale) => {
  const { data: imageData, height, width } = image;

  // Step 1 - filter out interesting points. Interesting points have strong pixel value changed across neighbours
  const isPixelSelected: (boolean | number)[] = [width * height];
  for (let i = 0; i < isPixelSelected.length; i++) isPixelSelected[i] = false;

  // Step 1.1 consider a pixel at position (x, y). compute:
  //   dx = ((data[x+1, y-1] - data[x-1, y-1]) + (data[x+1, y] - data[x-1, y]) + (data[x+1, y+1] - data[x-1, y-1])) / 256 / 3
  //   dy = ((data[x+1, y+1] - data[x+1, y-1]) + (data[x, y+1] - data[x, y-1]) + (data[x-1, y+1] - data[x-1, y-1])) / 256 / 3
  //   dValue =  sqrt(dx^2 + dy^2) / 2;
  const dValue = new Float32Array(imageData.length);
  for (let i = 0; i < width; i++) {
    dValue[i] = -1;
    dValue[width * (height - 1) + i] = -1;
  }

  for (let j = 0; j < height; j++) {
    dValue[j * width] = -1;
    dValue[j * width + width - 1] = -1;
  }

  for (let i = 1; i < width - 1; i++) {
    for (let j = 1; j < height - 1; j++) {
      const pos = i + width * j;

      let dx = 0.0;
      let dy = 0.0;

      for (let k = -1; k <= 1; k++) {
        dx += imageData[pos + width * k + 1] - imageData[pos + width * k - 1];
        dy += imageData[pos + width + k] - imageData[pos - width + k];
      }

      dx /= 3 * 256;
      dy /= 3 * 256;

      dValue[pos] = Math.sqrt((dx * dx + dy * dy) / 2);
    }
  }

  // Step 1.2 - select all pixel which is dValue largest than all its neighbour as "potential" candidate
  //  the number of selected points is still too many, so we use the value to further filter (e.g. largest the dValue, the better)
  const dValueHist = new Uint32Array(1000).fill(0); // histogram of dvalue scaled to [0, 1000)

  const neighbourOffsets = [-1, 1, -width, width];

  for (let i = 1; i < width - 1; i++) {
    for (let j = 1; j < height - 1; j++) {
      const pos = i + width * j;
      let isMax = true;

      for (let d = 0; d < neighbourOffsets.length; d++) {
        if (dValue[pos] <= dValue[pos + neighbourOffsets[d]]) {
          isMax = false;
          break;
        }
      }

      if (isMax) {
        let k = Math.floor(dValue[pos] * 1000);

        if (k > 999) k = 999; // k>999 should not happen if computaiton is correction
        if (k < 0) k = 0; // k<0 should not happen if computaiton is correction

        dValueHist[k] += 1;
        isPixelSelected[pos] = true;
      }
    }
  }

  // reduce number of points according to dValue.
  // actually, the whole Step 1. might be better to just sort the dvalues and pick the top (0.02 * width * height) points
  const maxPoints = 0.02 * width * height;
  let k = 999;
  let filteredCount = 0;

  while (k >= 0) {
    filteredCount += dValueHist[k];

    if (filteredCount > maxPoints) break;

    k--;
  }

  for (let i = 0; i < isPixelSelected.length; i++) {
    if (isPixelSelected[i]) {
      if (dValue[i] * 1000 < k) isPixelSelected[i] = false;
    }
  }

  // Step 2
  // prebuild cumulative sum matrix for fast computation
  const imageDataSqr: number[] = [];

  for (const [i, imgData] of imageData.entries()) {
    imageDataSqr[i] = imgData ** 2;
  }

  const imageDataCumsum = new Cumsum(imageData, width, height);
  const imageDataSqrCumsum = new Cumsum(imageDataSqr, width, height);

  // holds the max similariliy value computed within SEARCH area of each pixel
  //   idea: if there is high simliarity with another pixel in nearby area, then it's not a good feature point
  //         next step is to find pixel with low similarity
  const featureMap = new Float32Array(imageData.length);

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const pos = j * width + i;

      if (!isPixelSelected[pos]) {
        featureMap[pos] = 1.0;
        continue;
      }

      const vlen = templateVar({
        image,
        cx: i,
        cy: j,
        sdThresh: TEMPLATE_SD_THRESH,
        imageDataCumsum: imageDataCumsum,
        imageDataSqrCumsum: imageDataSqrCumsum,
      });

      if (vlen === null) {
        featureMap[pos] = 1.0;
        continue;
      }

      let max = -1.0;

      for (let jj = -SEARCH_SIZE1; jj <= SEARCH_SIZE1; jj++) {
        for (let ii = -SEARCH_SIZE1; ii <= SEARCH_SIZE1; ii++) {
          if (ii * ii + jj * jj <= SEARCH_SIZE2 ** 2) continue;

          const sim = getSimilarity({
            image,
            cx: i + ii,
            cy: j + jj,
            vlen: vlen,
            tx: i,
            ty: j,
            imageDataCumsum: imageDataCumsum,
            imageDataSqrCumsum: imageDataSqrCumsum,
          });

          if (sim === null) continue;

          if (sim > max) {
            max = sim;

            if (max > MAX_SIM_THRESH) break;
          }
        }

        if (max > MAX_SIM_THRESH) break;
      }

      featureMap[pos] = max;
    }
  }

  // Step 2.2 select feature
  const coords = selectFeature({
    image,
    featureMap,
    templateSize: TEMPLATE_SIZE,
    searchSize: SEARCH_SIZE2,
    occSize: OCCUPANCY_SIZE,
    maxSimThresh: MAX_THRESH,
    minSimThresh: MIN_THRESH,
    sdThresh: SD_THRESH,
    imageDataCumsum: imageDataCumsum,
    imageDataSqrCumsum: imageDataSqrCumsum,
  });

  return coords;
};

export default extract;
