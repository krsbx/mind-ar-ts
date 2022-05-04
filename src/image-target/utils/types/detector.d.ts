import { Vector2 } from 'three';
import { IMaximaMinimaPoint } from './compiler';

interface IMatches {
  querypoint: IMaximaMinimaPoint;
  keypoint: IMaximaMinimaPoint;
}

interface ICrop {
  startX: number;
  startY: number;
  cropSize: number;
}

interface IDebugExtra {
  pyramidImages: number[][];
  dogPyramidImages: number[] | null[];
  extremasResults: number[];
  extremaAngles: number[];
  prunedExtremas: number[][];
  localizedExtremas: number[][];
  matches: IMatches[];
  matches2: IMatches[];
  houghMatches: IMatches[];
  houghMatches2: IMatches[];
  inlierMatches: IMatches[];
  inlierMatches2: IMatches[];
  projectedImage: number[][];
  matchingPoints: number[][];
  crop: ICrop;
  goodTrack: number[];
  trackedPoints: Vector2[];
}

export type { ICrop, IDebugExtra, IMatches };
