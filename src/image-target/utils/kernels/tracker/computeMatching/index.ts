import kernel1 from './kernel1';
import kernel2 from './kernel2';
import kernel3 from './kernel3';

const computeMatching = (
  templateOneSize: number,
  templateSize: number,
  searchOneSize: number,
  searchGap: number,
  searchSize: number,
  targetHeight: number,
  targetWidth: number,
  featureCount: number
) => {
  const KERNEL1 = kernel1(
    templateOneSize,
    templateSize,
    searchOneSize,
    searchGap,
    searchSize,
    targetHeight,
    targetWidth,
    featureCount
  );

  const KERNEL2 = kernel2(searchOneSize, searchGap, searchSize, featureCount);

  const KERNEL3 = kernel3(featureCount);

  return [KERNEL1, KERNEL2, KERNEL3];
};

export default computeMatching;
