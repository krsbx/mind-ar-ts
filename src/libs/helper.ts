const isNil = (value: unknown): value is null | undefined => value === null || value === undefined;

const castTo = <NewType>(value: unknown): NewType => value as unknown as NewType;

export { isNil, castTo };
