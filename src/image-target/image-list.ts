import { Helper } from '../libs';
import { resize } from './utils/images';
import { ImageDataWithScale } from './utils/types/compiler';

const MIN_IMAGE_PIXEL_SIZE = 100;

// Build a list of image {data, width, height, scale} with different scales
const buildImageList = (inputImage: ImageData) => {
  const minScale = MIN_IMAGE_PIXEL_SIZE / Math.min(inputImage.width, inputImage.height);

  const scaleList: number[] = [];
  let c = minScale;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    scaleList.push(c);

    c *= Math.pow(2.0, 1.0 / 3.0);

    if (c >= 0.95) {
      c = 1;
      break;
    }
  }

  scaleList.push(c);
  scaleList.reverse();

  const imageList: ImageDataWithScale[] = [];

  for (let i = 0; i < scaleList.length; i++) {
    const imageData = Helper.castTo<ImageDataWithScale>(
      resize({ image: inputImage, ratio: scaleList[i] })
    );
    imageData.scale = scaleList[i];

    imageList.push(imageData);
  }

  return imageList;
};

const buildTrackingImageList = (inputImage: ImageData) => {
  const minDimension = Math.min(inputImage.width, inputImage.height);
  const scaleList: number[] = [];
  const imageList: ImageDataWithScale[] = [];

  scaleList.push(256.0 / minDimension);
  scaleList.push(128.0 / minDimension);

  for (let i = 0; i < scaleList.length; i++) {
    const imageData = Helper.castTo<ImageDataWithScale>(
      resize({ image: inputImage, ratio: scaleList[i] })
    );
    imageData.scale = scaleList[i];

    imageList.push(imageData);
  }

  return imageList;
};

export { buildImageList, buildTrackingImageList };
