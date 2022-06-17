export interface IInternalState {
  rawPosition: Vector2;
  position: Vector2;
  spread?: number;
  startTime?: number;
  startPosition?: Vector2;
  startSpread?: number;
  spreadChange?: number;
}

export interface ITouchState extends IInternalState {
  count: number;
}

export type IMouseState = Pick<IInternalState, 'rawPosition' | 'position' | 'startPosition'>;
