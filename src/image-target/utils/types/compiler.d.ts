import { Vector2 } from 'three';
import { INode } from './matching';

interface IMaximaMinimaPoint {
  maxima: boolean;
  x: number;
  y: number;
  scale: number;
  angle: number;
  descriptors: number[];
}

type ImageDataWithScale = ImageData & { scale: number };

interface ITrackingFeature extends ImageDataWithScale {
  points: Vector2[];
}

interface IKeyFrame {
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

interface ICompilerData {
  targetImage: ImageData;
  imageList: ImageDataWithScale[];
  matchingData: IKeyFrame[];
  trackingImageList: ImageDataWithScale[];
  trackingData: ITrackingFeature[];
}

interface IDataList {
  targetImage: {
    width: number;
    height: number;
  };
  trackingData: ITrackingFeature[];
  matchingData: IKeyFrame[];
}

export type {
  IMaximaMinimaPoint,
  ImageDataWithScale,
  IKeyFrame,
  ITrackingFeature,
  ICompilerData,
  IDataList,
};
