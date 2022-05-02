export interface IMaximaMinimaPoint {
  maxima: boolean;
  x: number;
  y: number;
  scale: number;
  angle: number[];
  descriptors: number[];
}

export type ImageDataWithScale = ImageData & { scale: number };

export interface IKeyFrame {
  maximaPoints: IMaximaMinimaPoint[];
  minimaPoints: IMaximaMinimaPoint[];
  maximaPointsCluster: {
    rootNode: Record<any, any>;
  };
  minimaPointsCluster: {
    rootNode: Record<any, any>;
  };
  width: number;
  height: number;
  scale: any;
}
