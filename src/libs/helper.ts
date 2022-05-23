const isNil = (value: unknown): value is null | undefined => value === null || value === undefined;

const castTo = <NewType>(value: unknown): NewType => value as unknown as NewType;

const hasOwnProperty = <X extends object, Y extends PropertyKey>(
  obj: X,
  property: Y
  // eslint-disable-next-line no-prototype-builtins
): obj is X & Record<Y, unknown> => obj.hasOwnProperty(property);

export { isNil, castTo, hasOwnProperty };
