export const isNil = (value: unknown): value is null | undefined =>
  value === null || value === undefined;

export const castTo = <NewType>(value: unknown): NewType => value as NewType;

export const hasOwnProperty = <X extends object, Y extends PropertyKey>(
  obj: X,
  property: Y
  // eslint-disable-next-line no-prototype-builtins
): obj is X & Record<Y, unknown> => obj.hasOwnProperty(property);

export const deepClone = <T>(obj: T): T => {
  if (typeof obj !== 'object' || obj === null) return obj as T;

  const clone = Array.isArray(obj) ? castTo<T>([]) : ({} as T);

  for (const key in obj) {
    const value = obj[key];

    clone[key] = deepClone(value);
  }

  return clone as T;
};

export const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const clone = deepClone(obj);

  for (const key of keys) {
    delete clone[key];
  }

  return clone;
};

export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const clone = Array.isArray(obj) ? castTo<T>([]) : ({} as T);

  for (const key of keys) {
    clone[key] = obj[key];
  }

  return clone;
};
