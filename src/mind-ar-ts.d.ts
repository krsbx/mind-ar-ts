import tf from '@tensorflow/tfjs';
import THREE from 'three';
import { Controller } from './controller/image-target';
import { Compiler } from './compiler/image-target';
import { UI } from './ui/ui';
import { MindARThree } from './three/image-target';

declare global {
  interface Window {
    MINDAR: {
      IMAGE: {
        Controller: typeof Controller;
        Compiler: typeof Compiler;
        UI: typeof UI;
        MindARThree: typeof MindARThree;
        THREE: typeof THREE;
        tf: typeof tf;
      };
      FACE: {
        Controller: typeof Controller;
        UI: typeof UI;
      };
    };
  }
}
