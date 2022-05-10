// All Constant being used in Image Target are stored in here
import * as controller from './controller';
import * as detector from './detector';
import * as estimation from './estimation';
import * as freak from './freak';
import * as matching from './matching';
import * as tracker from './tracker';

const DEFAULT_WORKER = {
  CONTROLLER: new Worker('/src/image-target/controller.worker.ts', { type: 'module' }),
  COMPILER: new Worker('/src/image-target/compiler.worker.ts', { type: 'module' }),
};

const PRODUCTION = 'production';

const IS_PRODUCTION =
  import.meta.env?.VITE_ENV === PRODUCTION ?? process.env?.NODE_ENV === PRODUCTION;

export {
  controller,
  detector,
  estimation,
  freak,
  matching,
  tracker,
  DEFAULT_WORKER,
  IS_PRODUCTION,
};
