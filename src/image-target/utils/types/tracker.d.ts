import { CumulativeSum } from '../../utils/cumsum';

interface IBaseOptions {
  image: ImageData;
  imageDataCumsum: CumulativeSum;
  imageDataSqrCumsum: CumulativeSum;
  sdThresh: number;
}

interface IOptions extends IBaseOptions {
  featureMap: Float32Array;
  templateSize: number;
  searchSize: number;
  occSize: number;
  maxSimThresh: number;
  minSimThresh: number;
}

interface ISimiliarityOptions extends Omit<IBaseOptions, 'sdThresh'> {
  cx: number;
  cy: number;
  tx: number;
  ty: number;
  vlen: number;
}

interface ITemplateOptions extends IBaseOptions, Pick<ISimiliarityOptions, 'cx' | 'cy'> {}

export type { IOptions, ISimiliarityOptions, ITemplateOptions };
