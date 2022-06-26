import * as tf from '@tensorflow/tfjs';
import * as THREE from 'three';
import { Scene } from 'aframe';
import ImageController from './image-target/controller';
import FaceController from './face-target/controller';
import { Controller as LocationController } from './geo-location/controller';
import ImageCompiler from './image-target/compiler';
import UI from './ui';
import ImageThree from './image-target/three';
import FaceThree from './face-target/three';
import { Coordinates } from './src/geo-location/utils/geo-location';

declare global {
  interface Window {
    MINDAR: {
      IMAGE: {
        Controller: typeof ImageController;
        Compiler: typeof ImageCompiler;
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
        Controller: typeof LocationController;
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

  interface DeviceOrientationEvent {
    webkitCompassHeading?: number | null;
    webkitCompassAccuracy?: number | null;
  }

  interface Event {
    detail: {
      distance?: number;
      location?: Scene;
      position?: Coordinates;
      origin?: Coordinates;
      message?: string;
      placeIndex?: number;
      positionChange?: Vector2;
      spreadChange?: number;
      startSpread?: number;
    };
  }
}

declare module 'mind-ar-ts' {
  export const imageTarget = {
    Controller: ImageController,
    Compiler: ImageCompiler,
    UI: UI,
  };

  export const faceTarget = {
    Controller: FaceController,
    UI: UI,
  };
}
