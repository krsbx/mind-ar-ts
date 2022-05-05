import kernel1 from './kernel1';
import kernel2 from './kernel2';

const applyFilter = (imageHeight: number, imageWidth: number) => {
  const KERNEL1 = kernel1(imageHeight, imageWidth);
  const KERNEL2 = kernel2(imageHeight, imageWidth);

  return [KERNEL1, KERNEL2];
};

export default applyFilter;
