import { extract } from './tracker/extract';
import { buildTrackingImageList } from './image-list';
import { ImageDataWithScale, ITrackingFeature } from './utils/types/compiler';
import { WORKER_EVENT } from './utils/constant/compiler';

const _extractTrackingFeatures = (
  imageList: ImageDataWithScale[],
  doneCallback: (iteration: number) => void
) => {
  const featureSets: ITrackingFeature[] = [];

  for (let i = 0; i < imageList.length; i++) {
    const image = imageList[i];
    const points = extract(image);

    const featureSet = {
      data: image.data,
      scale: image.scale,
      width: image.width,
      height: image.height,
      points,
    };

    featureSets.push(featureSet);

    doneCallback(i);
  }

  return featureSets;
};

onmessage = (msg) => {
  const { data } = msg;

  switch (data.type) {
    case WORKER_EVENT.COMPILE:
      {
        const { targetImages } = data;
        const percentPerImage = 50.0 / targetImages.length;
        let percent = 0.0;
        const list: ITrackingFeature[][] = [];

        for (let i = 0; i < targetImages.length; i++) {
          const targetImage = targetImages[i];
          const imageList = buildTrackingImageList(targetImage);
          const percentPerAction = percentPerImage / imageList.length;

          const trackingData = _extractTrackingFeatures(imageList, () => {
            percent += percentPerAction;
            postMessage({ type: WORKER_EVENT.PROGRESS, percent });
          });

          list.push(trackingData);
        }

        postMessage({
          type: WORKER_EVENT.COMPILE_DONE,
          list,
        });
      }
      break;
  }
};

export { _extractTrackingFeatures };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default null as any;
