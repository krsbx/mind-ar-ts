import { IMouseState, ITouchState } from '../utils/types/aframe';

export interface IDetector {
  enabled: boolean;
}

export interface IMouseGestureRotation extends IDetector {
  rotationFactor: number;
}

export interface IMouseGestureScale extends IDetector {
  minScale: number;
  maxScale: number;
}

export interface IGestureDetector {
  previousState: ITouchState | null;
  currentState: ITouchState | null;
}

export interface IMouseDetector {
  previousState: IMouseState | null;
  currentState: IMouseState | null;
  active: boolean;
}
