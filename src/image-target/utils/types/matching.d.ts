import { createRandomizer } from '../randomizer';

interface INode {
  leaf: boolean;
  centerPointIndex: number | null;
  pointIndexes: number[];
  children: INode[];
}

interface IQueryBinLocation {
  binX: number;
  binY: number;
  binAngle: number;
  binScale: number;
}

interface INodeQueue {
  node: INode;
  d: number;
}

type RandomizerType = ReturnType<typeof createRandomizer>;

export type { INode, RandomizerType, IQueryBinLocation, INodeQueue };
