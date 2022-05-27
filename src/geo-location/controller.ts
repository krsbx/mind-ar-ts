// ! Control the geo location
// ! We're not using the webworker for geolocation
// ! because might run to an issue while updating the position

import { SEC2MS } from './utils/constant';
import { haversineDist } from './utils/distance';
import { ControllerConstructor, Coordinates } from './utils/types/geo-location';

class Controller {
  private simulateLatitude: number;
  private simulateLongitude: number;
  private simulateAltitude: number;
  private positionMinAccuracy: number;
  private minDistance: number;
  private maxDistance: number;
  private gpsMinDistance: number;
  private gpsTimeInterval: number;
  private watchPositionId!: number;
  private lastPosition!: Coordinates;
  private currentPosition!: Coordinates;
  private originPosition: Coordinates | null;
  private isEmulated: boolean;

  constructor({
    simulateAltitude = 0,
    simulateLatitude = 0,
    simulateLongitude = 0,
    positionMinAccuracy = 100,
    minDistance = 10,
    maxDistance = 30,
    gpsMinDistance = 10,
    gpsTimeInterval = 3,
  }: ControllerConstructor) {
    this.simulateAltitude = simulateAltitude;
    this.simulateLatitude = simulateLatitude;
    this.simulateLongitude = simulateLongitude;
    this.positionMinAccuracy = positionMinAccuracy;
    this.minDistance = minDistance;
    this.maxDistance = maxDistance;
    this.gpsMinDistance = gpsMinDistance;
    this.gpsTimeInterval = gpsTimeInterval;
    this.originPosition = null;

    this.isEmulated = simulateLatitude !== 0 && simulateLongitude !== 0;
  }

  startAR() {
    this._initWatchPosition();
  }

  private _initWatchPosition() {
    if (this.isEmulated) {
      this._getEmulatedPosition();
      return;
    }

    this.watchPositionId = this._watchPosition();
  }

  private _getEmulatedPosition() {
    const localPosition = this.currentPosition || ({} as Coordinates);

    localPosition.latitude = this.simulateLatitude;
    localPosition.longitude = this.simulateLongitude;

    if (this.simulateAltitude !== 0) localPosition.altitude = this.simulateAltitude;

    this.currentPosition = localPosition;

    // re-trigger initialization for new origin
    if (this.originPosition) this.originPosition = null;

    this._updatePosition();
  }

  private _watchPosition() {
    return navigator.geolocation.watchPosition(
      this._onPositionUpdate.bind(this),
      this._onPositionError.bind(this),
      {
        enableHighAccuracy: true,
        maximumAge: this.gpsTimeInterval,
        timeout: 30 * SEC2MS, // Will timeout after 30 seconds
      }
    );
  }

  private _onPositionUpdate({ coords }: GeolocationPosition) {
    const localPosition: Coordinates = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: coords.altitude,
      accuracy: coords.accuracy,
      altitudeAccuracy: coords.altitudeAccuracy,
    };

    // If user specified an altitude, we'll use it
    if (this.simulateAltitude !== 0) localPosition.altitude = this.simulateAltitude;

    this.currentPosition = localPosition;

    const distanceMoved = haversineDist(this.lastPosition, this.currentPosition);

    // If the user has moved more than the min distance, we'll update the position
    if (distanceMoved >= this.gpsMinDistance || !this.originPosition) {
      this._updatePosition();
      this.lastPosition = this.currentPosition;
    }
  }

  private _onPositionError() {
    navigator.geolocation.clearWatch(this.watchPositionId);
  }

  // Update user position after move
  private _updatePosition() {
    // TODO: show a notification for the user when the accuracy is too low
    if (this.currentPosition.accuracy > this.positionMinAccuracy) return;

    // Set the origin position on initialization
    if (!this.originPosition) this.originPosition = this.currentPosition;

    this._setPosition();
  }

  private _setPosition() {}

  computeDistance(src: Coordinates, dest: Coordinates, isPlace = false) {
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
}

export { Controller };
