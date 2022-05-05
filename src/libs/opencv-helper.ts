import cv from './opencv';

let initialized = false;

const _cv = {} as any;

const waitResolves: ((value?: any) => void)[] = [];

const waitCV = async () => {
  if (initialized) return true;
  return new Promise((resolve) => {
    waitResolves.push(resolve);
  });
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
cv.then((target: any) => {
  initialized = true;

  Object.assign(_cv, target);

  waitResolves.forEach((resolve) => {
    resolve();
  });
});

export { _cv as cv, waitCV };
