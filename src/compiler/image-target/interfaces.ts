interface IMaximaMinimaPoint {
  maxima: boolean;
  x: number;
  y: number;
  scale: number;
  angle: number[];
  descriptors: number[];
}

type ImageDataWithScale = ImageData & { scale: number };

interface IKeyFrame {
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

export type { IMaximaMinimaPoint, ImageDataWithScale, IKeyFrame };
