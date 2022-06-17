export interface ITouchState {
  count: number;
  rawPosition: Vector2;
  position: Vector2;
  spread?: number;
  startTime?: number;
  startPosition?: Vector2;
  startSpread?: number;
  spreadChange?: number;
}
