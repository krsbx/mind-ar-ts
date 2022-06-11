// All Constant being used in Image Target are stored in here
import * as controller from './controller';
import * as detector from './detector';
import * as estimation from './estimation';
import * as freak from './freak';
import * as matching from './matching';
import * as tracker from './tracker';

export const DEFAULT_WORKER = {
  CONTROLLER: new Worker('/src/image-target/controller.worker.ts', { type: 'module' }),
  COMPILER: new Worker('/src/image-target/compiler.worker.ts', { type: 'module' }),
};

export { controller, detector, estimation, freak, matching, tracker };
