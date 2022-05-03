import * as tf from '@tensorflow/tfjs';
import * as THREE from 'three';
import { Controller } from './image-target/controller';
import { Compiler } from './image-target/compiler';
import { UI } from './ui/ui';
import { MindARThree } from './image-target/three';

declare global {
  interface Window {
    MINDAR: {
      IMAGE: {
        Controller: typeof Controller;
        Compiler: typeof Compiler;
        UI: typeof UI;
        MindARThree: typeof MindARThree;
        THREE: THREE;
        tf: tf;
      };
      FACE: {
        Controller: typeof Controller;
        UI: typeof UI;
      };
    };
  }
}
