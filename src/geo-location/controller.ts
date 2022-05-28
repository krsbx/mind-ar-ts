/* eslint-disable @typescript-eslint/no-explicit-any */
// ! Control the geo location
// ! We're not using the webworker for geolocation
// ! because might run to an issue while updating the position

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
  private minDistance!: number;
  private maxDistance!: number;

  constructor() {
    this.location = [];
  }

  setupCamera(cameraParams: Omit<CameraTrackerConstructor, 'controller'>) {
    this.camera = new CameraTracker({ ...cameraParams, controller: this });
    this.minDistance = cameraParams.minDistance;
    this.maxDistance = cameraParams.maxDistance;
  }

  addLocation(locationParams: Omit<LocationTrackerConstructor, 'controller'>) {
    const location = new LocationTracker({ ...locationParams, controller: this });
    this.location.push(location);
  }

  computeDistance(src: HaversineParams, dest: HaversineParams, isPlace = false) {
    const distance = haversineDist(src, dest);

    // If its a place and the distance is too near to the user,
    // we'll return the maximum distance as possible and let the caller handle it
    if (isPlace && this.minDistance > 0 && distance < this.minDistance)
      return Number.MAX_SAFE_INTEGER;

    // If its a place and the distance is too far to the user,
    // we'll return the maximum distance as possible and let the caller handle it
    if (isPlace && this.maxDistance > 0 && distance > this.maxDistance)
      return Number.MAX_SAFE_INTEGER;

    return distance;
  }

  startAR() {
    this.camera.startAR();
  }
}

export { Controller };
