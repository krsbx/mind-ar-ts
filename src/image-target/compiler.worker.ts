/* eslint-disable no-case-declarations */
import extract from './tracker/extract';
import { buildTrackingImageList } from './image-list';
import { WORKER_EVENT } from './utils/constant/compiler';
import { ImageDataWithScale, ITrackingFeature } from './utils/types/compiler';

const _extractTrackingFeatures = (
  imageList: ImageDataWithScale[],
  doneCallback: (iteration: number) => void
) => {
  const featureSets: ITrackingFeature[] = [];

  for (const [i, image] of imageList.entries()) {
    const points = extract(image);

    const featureSet = {
      data: image.data,
      scale: image.scale,
      width: image.width,
      height: image.height,
      points,
    } as ITrackingFeature;

    featureSets.push(featureSet);

    doneCallback(i);
  }

  return featureSets;
};

onmessage = (msg) => {
  const { data } = msg;

  switch (data.type) {
    case WORKER_EVENT.COMPILE:
      const { targetImages } = data;
      const percentPerImage = 50.0 / targetImages.length;

      let percent = 0.0;
      const list: ITrackingFeature[][] = [];

      for (const targetImage of targetImages) {
        const imageList = buildTrackingImageList(targetImage);
        const percentPerAction = percentPerImage / imageList.length;

        const trackingData = _extractTrackingFeatures(<ImageDataWithScale[]>imageList, () => {
          percent += percentPerAction;
          postMessage({ type: WORKER_EVENT.PROGRESS, percent });
        });

        list.push(trackingData);
      }

      postMessage({
        type: WORKER_EVENT.COMPILE_DONE,
        list,
      });
      break;
  }
};

export default {} as typeof Worker & (new () => Worker);
