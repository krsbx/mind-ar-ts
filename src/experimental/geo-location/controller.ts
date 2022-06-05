import { haversineDist } from '../../geo-location/utils/distance';
import { HaversineParams } from '../../geo-location/utils/types/geo-location';

class Controller {
  private minDistance: number;
  private maxDistance: number;

  constructor(minDistance: number, maxDistance: number) {
    this.minDistance = minDistance;
    this.maxDistance = maxDistance;
  }

  public computeDistanceMeters(src: HaversineParams, dest: HaversineParams, isPlace = false) {
    const distance = haversineDist(src, dest);

    const minDist = this.minDistance;
    const maxDist = this.maxDistance;

    // If its a place and the distance is too near to the user,
    // we'll return the maximum distance as possible and let the caller handle it
    if (isPlace && minDist > 0 && distance < minDist) return Number.MAX_SAFE_INTEGER;

    // If its a place and the distance is too far to the user,
    // we'll return the maximum distance as possible and let the caller handle it
    if (isPlace && maxDist > 0 && distance > maxDist) return Number.MAX_SAFE_INTEGER;

    return distance;
  }
}

export default Controller;
