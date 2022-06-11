import Cumsum from '../../utils/cumsum';

export interface IBaseOptions {
  image: ImageData;
  imageDataCumsum: Cumsum;
  imageDataSqrCumsum: Cumsum;
  sdThresh: number;
}

export interface IOptions extends IBaseOptions {
  featureMap: Float32Array;
  templateSize: number;
  searchSize: number;
  occSize: number;
  maxSimThresh: number;
  minSimThresh: number;
}

export interface ISimiliarityOptions extends Omit<IBaseOptions, 'sdThresh'> {
  cx: number;
  cy: number;
  tx: number;
  ty: number;
  vlen: number;
}

export interface ITemplateOptions extends IBaseOptions, Pick<ISimiliarityOptions, 'cx' | 'cy'> {}
