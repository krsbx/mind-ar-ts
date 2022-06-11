import createRandomizer from '../randomizer';

export interface INode {
  leaf: boolean;
  centerPointIndex: number | null;
  pointIndexes: number[];
  children: INode[];
}

export interface IQueryBinLocation {
  binX: number;
  binY: number;
  binAngle: number;
  binScale: number;
}

export interface INodeQueue {
  node: INode;
  d: number;
}

export type RandomizerType = ReturnType<typeof createRandomizer>;
