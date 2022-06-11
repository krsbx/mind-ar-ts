import { CameraTracker } from './tracker/camera';
import { LocationTracker } from './tracker/location';
import {
  CameraTrackerConstructor,
  HaversineParams,
  LocationTrackerConstructor,
} from '../../geo-location/utils/types/geo-location';

declare class Controller {
  camera: CameraTracker;
  location: LocationTracker[];
  minDistance: number;
  maxDistance: number;
  constructor();
  setupCamera(cameraParams: Omit<CameraTrackerConstructor, 'controller'>): void;
  addLocation(locationParams: Omit<LocationTrackerConstructor, 'controller'>): void;
  computeDistance({
    src,
    dest,
    isPlace,
    minDistance,
    maxDistance,
  }: {
    src: HaversineParams;
    dest: HaversineParams;
    isPlace?: boolean;
    minDistance?: number;
    maxDistance?: number;
  }): number;
  startAR(): void;
  updateRotation(): void;
}

export { Controller };
