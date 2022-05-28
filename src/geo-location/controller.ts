/* eslint-disable @typescript-eslint/no-explicit-any */
// ! Control the geo location
// ! We're not using the webworker for geolocation
// ! because might run to an issue while updating the position

import { AScene } from 'aframe';
import { degToRad, getDeviceOrientationEventName, radToDeg } from './utils/common';
import { AR_EVENT_NAME, AR_POSITION_MULTIPLIER, FULL_CIRCLE_DEG, SEC2MS } from './utils/constant';
import { getPositionMultiplier, haversineDist } from './utils/distance';
import { computeCompassHeading, getHeading } from './utils/compass';
import { ControllerConstructor, Coordinates, HaversineParams } from './utils/types/geo-location';
import { Helper } from '../libs';

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
  public heading!: number;
  public originPosition: Coordinates | null;
  private isEmulated: boolean;
  public camera: typeof AScene;
  private lookControls: any;
  private orientationEventName: string;

  constructor({
    simulateAltitude = 0,
    simulateLatitude = 0,
    simulateLongitude = 0,
    positionMinAccuracy = 100,
    minDistance = 10,
    maxDistance = 30,
    gpsMinDistance = 10,
    gpsTimeInterval = 3,
    camera,
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
    this.camera = camera;
    this.lookControls = camera.components['look-controls'];

    this.isEmulated = simulateLatitude !== 0 && simulateLongitude !== 0;
    this.orientationEventName = getDeviceOrientationEventName();

    if (this.orientationEventName === '') console.error('Compass is not supported');
    window.addEventListener(this.orientationEventName, this._onDeviceOrientation);
  }

  startAR() {
    this._initWatchPosition();
  }

  private _initWatchPosition() {
    if (this.isEmulated) {
      this.getEmulatedPosition();
      return;
    }

    this.watchPositionId = this._watchPosition();
  }

  getEmulatedPosition() {
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
    if (!this.originPosition) {
      this.originPosition = this.currentPosition;

      // Invoke any callback that subscribes to the CAMERA_ORIGIN_SET
      window.dispatchEvent(new Event(AR_EVENT_NAME.CAMERA_ORIGIN_SET));
    }

    this._setPosition();
  }

  // Need to trigger manually from the camera
  updateRotation() {
    const heading = FULL_CIRCLE_DEG - this.heading;
    const rotation = this.camera.getAttribute('rotation');
    const yawRotation = radToDeg(this.lookControls.yawObject.rotation.y);

    const offset = (heading - (rotation - yawRotation)) % FULL_CIRCLE_DEG;
    this.lookControls.yawObject.rotation.y = degToRad(offset);
  }

  private _setPosition() {
    if (!this.originPosition) return;

    const position = this.camera.getAttribute('position');

    const dstCoords: HaversineParams = {
      longitude: this.currentPosition.longitude,
      latitude: this.originPosition.latitude,
    };

    const distance = this.computeDistance(this.originPosition, dstCoords);

    position.x = distance;
    position.z = distance;

    position.x *= getPositionMultiplier(
      this.originPosition,
      this.currentPosition,
      AR_POSITION_MULTIPLIER.X
    );
    position.z *= getPositionMultiplier(
      this.originPosition,
      this.currentPosition,
      AR_POSITION_MULTIPLIER.Z
    );

    this.camera.setAttribute('position', position);

    window.dispatchEvent(
      new CustomEvent(AR_EVENT_NAME.LOCATION_UPDATED, {
        detail: {
          position,
          message: 'Location updated',
        },
      })
    );
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

  private _onDeviceOrientation(ev: Event) {
    const event = ev as DeviceOrientationEvent;

    const hasCompassHeading = !!event.webkitCompassHeading;
    const hasWebKitAccuracy = !!event.webkitCompassAccuracy;

    if (hasCompassHeading && hasWebKitAccuracy) {
      const heading = getHeading(event);

      if (Helper.isNil(heading)) return;

      this.heading = heading;
      return;
    }

    if (event.alpha === null) {
      console.warn('event.alpha is null');
      return;
    }

    if (event.absolute === false) {
      console.warn('event.absolute is false');
      return;
    }

    this.heading = computeCompassHeading(event.alpha, event.beta, event.gamma);
  }
}

export { Controller };
