const downsampleBilinear = ({ image }: { image: ImageData }) => {
  const { data, width, height } = image;

  const dstWidth = Math.floor(width / 2);
  const dstHeight = Math.floor(height / 2);

  const temp = new Float32Array(dstWidth * dstHeight);
  const offsets = [0, 1, width, width + 1];

  for (let j = 0; j < dstHeight; j++) {
    for (let i = 0; i < dstWidth; i++) {
      const srcPos = j * 2 * width + i * 2;
      let value = 0.0;

      for (let d = 0; d < offsets.length; d++) {
        value += data[srcPos + offsets[d]];
      }

      value *= 0.25;
      temp[j * dstWidth + i] = value;
    }
  }

  return { data: temp, width: dstWidth, height: dstHeight };
};

export { downsampleBilinear };
