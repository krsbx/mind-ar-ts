/* eslint-disable @typescript-eslint/no-explicit-any */
// ! Control the geo location
// ! We're not using the webworker for geolocation
// ! because might run to an issue while updating the position

import { Helper } from '../libs';
import { CameraTracker } from './tracker/camera';
import { LocationTracker } from './tracker/location';
import { haversineDist } from './utils/distance';
import {
  CameraTrackerConstructor,
  HaversineParams,
  LocationTrackerConstructor,
} from './utils/types/geo-location';

class Controller {
  public camera!: CameraTracker;
  public location: LocationTracker[];
  public minDistance!: number;
  public maxDistance!: number;

  constructor() {
    this.location = [];
  }

  setupCamera(cameraParams: Omit<CameraTrackerConstructor, 'controller'>) {
    this.camera = new CameraTracker({ ...cameraParams, controller: this });
    this.minDistance = cameraParams.minDistance ?? 0;
    this.maxDistance = cameraParams.maxDistance ?? 0;
  }

  addLocation(locationParams: Omit<LocationTrackerConstructor, 'controller'>) {
    const location = new LocationTracker({
      ...locationParams,
      controller: this,
      camera: this.camera.camera,
    });
    this.location.push(location);
  }

  computeDistance({
    src,
    dest,
    isPlace = false,
    minDistance = -1,
    maxDistance = -1,
  }: {
    src: HaversineParams;
    dest: HaversineParams;
    isPlace?: boolean;
    minDistance?: number;
    maxDistance?: number;
  }) {
    const minDist = minDistance > -1 ? minDistance : this.minDistance;
    const maxDist = maxDistance > -1 ? maxDistance : this.maxDistance;

    const distance = haversineDist(src, dest);

    // If its a place and the distance is too near to the user,
    // we'll return the maximum distance as possible and let the caller handle it
    if (isPlace && minDist > 0 && distance < minDist) return Number.MAX_SAFE_INTEGER;

    // If its a place and the distance is too far to the user,
    // we'll return the maximum distance as possible and let the caller handle it
    if (isPlace && maxDist > 0 && distance > maxDist) return Number.MAX_SAFE_INTEGER;

    return distance;
  }

  startAR() {
    this.camera.startAR();
  }

  updateRotation() {
    if (Helper.isNil(this.camera)) return;

    this.camera.updateRotation();
  }
}

export { Controller };
