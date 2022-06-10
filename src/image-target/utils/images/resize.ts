import { Helper } from '../../../libs';

const resize = ({ image, ratio }: { image: ImageData; ratio: number }) => {
  const width = Math.round(image.width * ratio);
  const height = Math.round(image.height * ratio);

  const imageData = new Uint8Array(width * height);

  for (let i = 0; i < width; i++) {
    const si1 = Math.round((1.0 * i) / ratio);
    let si2 = Math.round((1.0 * (i + 1)) / ratio) - 1;

    if (si2 >= image.width) si2 = image.width - 1;

    for (let j = 0; j < height; j++) {
      const sj1 = Math.round((1.0 * j) / ratio);
      let sj2 = Math.round((1.0 * (j + 1)) / ratio) - 1;

      if (sj2 >= image.height) sj2 = image.height - 1;

      let sum = 0;
      let count = 0;

      for (let ii = si1; ii <= si2; ii++) {
        for (let jj = sj1; jj <= sj2; jj++) {
          sum += 1.0 * image.data[jj * image.width + ii];
          count += 1;
        }
      }

      imageData[j * width + i] = Math.floor(sum / count);
    }
  }

  return Helper.castTo<ImageData>({ data: imageData, width: width, height: height });
};

export default resize;
