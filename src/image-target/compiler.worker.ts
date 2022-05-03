import { extract } from './tracker/extract';
import { buildTrackingImageList } from './image-list';
import { ImageDataWithScale } from './utils/types/compiler';

const ctx: Worker = self as any;

const _extractTrackingFeatures = (
  imageList: ImageDataWithScale[],
  doneCallback: (iteration: number) => void
) => {
  const featureSets = [];
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

ctx.addEventListener('message', (msg) => {
  const { data } = msg;
  if (data.type === 'compile') {
    const { targetImages } = data;
    const percentPerImage = 50.0 / targetImages.length;
    let percent = 0.0;
    const list = [];
    for (let i = 0; i < targetImages.length; i++) {
      const targetImage = targetImages[i];
      const imageList = buildTrackingImageList(targetImage);
      const percentPerAction = percentPerImage / imageList.length;

      const trackingData = _extractTrackingFeatures(imageList, () => {
        percent += percentPerAction;
        ctx.postMessage({ type: 'progress', percent });
      });

      list.push(trackingData);
    }

    ctx.postMessage({
      type: 'compileDone',
      list,
    });
  }
});
