import { INode } from './matching';

export interface IMaximaMinimaPoint {
  maxima: boolean;
  x: number;
  y: number;
  scale: number;
  angle: number;
  descriptors: number[];
}

export type ImageDataWithScale = ImageData & { scale: number };

export interface ITrackingFeature extends ImageDataWithScale {
  points: Vector2[];
}

export interface IKeyFrame {
  maximaPoints: IMaximaMinimaPoint[];
  minimaPoints: IMaximaMinimaPoint[];
  maximaPointsCluster: {
    rootNode: INode;
  };
  minimaPointsCluster: {
    rootNode: INode;
  };
  width: number;
  height: number;
  scale: number;
}

export interface ICompilerData {
  targetImage: ImageData;
  imageList: ImageDataWithScale[];
  matchingData: IKeyFrame[];
  trackingImageList: ImageDataWithScale[];
  trackingData: ITrackingFeature[];
}

export interface IDataList {
  targetImage: {
    width: number;
    height: number;
  };
  trackingData: ITrackingFeature[];
  matchingData: IKeyFrame[];
}
