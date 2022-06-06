import { haversineDist } from '../../geo-location/utils/distance';
import {
  CameraTrackerConstructor,
  HaversineParams,
  LocationTrackerConstructor,
} from '../../geo-location/utils/types/geo-location';
import { Helper } from '../../libs';
import CameraTracker from './tracker/camera';
import LocationTracker from './tracker/location';

class Controller {
  private minDistance: number;
  private maxDistance: number;
  public location: LocationTracker[];
  public camera!: CameraTracker;

  constructor(minDistance: number, maxDistance: number) {
    this.minDistance = minDistance;
    this.maxDistance = maxDistance;

    this.location = [];
  }

  public setupCamera(cameraParams: Omit<CameraTrackerConstructor, 'controller'>) {
    this.camera = new CameraTracker({ ...cameraParams, controller: this as any });
    this.minDistance = cameraParams.minDistance ?? 0;
    this.maxDistance = cameraParams.maxDistance ?? 0;
  }

  public addLocation(locationParams: Omit<LocationTrackerConstructor, 'controller'>) {
    const location = new LocationTracker({
      ...locationParams,
      controller: this as any,
      camera: this.camera.camera,
    });

    this.location.push(location);
  }

  public computeDistanceMeters(src: HaversineParams, dest: HaversineParams, isPlace = false) {
    const distance = haversineDist(src, dest);

    const minDist = this.minDistance;
    const maxDist = this.maxDistance;

    // * If its a place and the distance is too near to the user,
    // * we'll return the maximum distance as possible and let the caller handle it
    if (isPlace && minDist > 0 && distance < minDist) return Number.MAX_SAFE_INTEGER;

    // * If its a place and the distance is too far to the user,
    // * we'll return the maximum distance as possible and let the caller handle it
    if (isPlace && maxDist > 0 && distance > maxDist) return Number.MAX_SAFE_INTEGER;

    return distance;
  }

  public startAR() {
    this.camera.startAR();
  }

  public updateRotation() {
    if (Helper.isNil(this.camera)) return;

    this.camera.updateRotation();
  }
}

export default Controller;
