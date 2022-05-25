import * as tf from '@tensorflow/tfjs';
import * as THREE from 'three';
import { Controller as ImageController } from './image-target/controller';
import { Controller as FaceController } from './face-target/controller';
import { Compiler } from './image-target/compiler';
import { UI } from './ui/ui';
import { MindARThree as ImageThree } from './image-target/three';
import { MindARThree as FaceThree } from './face-target/three';

declare global {
  interface Window {
    MINDAR: {
      IMAGE: {
        Controller: typeof ImageController;
        Compiler: typeof Compiler;
        UI: typeof UI;
        MindARThree: typeof ImageThree;
        THREE: THREE;
        tf: tf;
      };
      FACE: {
        Controller: typeof FaceController;
        UI: typeof UI;
        MindARThree: typeof FaceThree;
        THREE: THREE;
      };
      LOCATION: {
        UI: typeof UI;
      };
    };
  }

  interface Vector2 {
    x: number;
    y: number;
  }

  interface Vector3 extends Vector2 {
    z: number;
  }
}
