/* eslint-disable @typescript-eslint/no-explicit-any */
// * We split the tracker into 2 parts:
// * 1. The camera
// * 2. The location/place

import { AScene } from 'aframe';
import { Helper } from '../../libs';
import { Controller } from '../controller';
import { degToRad, getDeviceOrientationEventName, radToDeg } from '../utils/common';
import { computeCompassHeading, getHeading } from '../utils/compass';
import { AR_EVENT_NAME, AR_POSITION_MULTIPLIER, FULL_CIRCLE_DEG, SEC2MS } from '../utils/constant';
import { getPositionMultiplier, haversineDist } from '../utils/distance';
import {
  CameraTrackerConstructor,
  Coordinates,
  HaversineParams,
} from '../utils/types/geo-location';

class CameraTracker {
  private controller: Controller;
  // All the properties are set to public since it will be used in other tracker classes
  public simulateLatitude: number;
  public simulateLongitude: number;
  public simulateAltitude: number;
  public positionMinAccuracy: number;
  public minDistance: number;
  public maxDistance: number;
  public gpsMinDistance: number;
  public gpsTimeInterval: number;
  public watchPositionId!: number;
  public lastPosition: HaversineParams;
  public currentPosition!: Coordinates;
  public heading!: number;
  public originPosition: Coordinates | null;
  public isEmulated: boolean;
  public camera: typeof AScene;
  public lookControls: any;
  public orientationEventName: string;

  constructor({
    simulateAltitude = 0,
    simulateLatitude = 0,
    simulateLongitude = 0,
    positionMinAccuracy = 100,
    minDistance = 0,
    maxDistance = 0,
    gpsMinDistance = 3,
    gpsTimeInterval = 3,
    controller,
    camera,
  }: CameraTrackerConstructor) {
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
    this.controller = controller;

    this.isEmulated = simulateLatitude !== 0 && simulateLongitude !== 0;
    this.orientationEventName = getDeviceOrientationEventName();

    this.lastPosition = {
      longitude: 0,
      latitude: 0,
    };

    if (this.orientationEventName === '') console.error('Compass is not supported');
    window.addEventListener(this.orientationEventName, this._onDeviceOrientation);
  }

  startAR() {
    this._initWatchPosition();
  }

  // Need to trigger manually from the camera
  updateRotation() {
    const heading = FULL_CIRCLE_DEG - this.heading;
    const rotation = this.camera.getAttribute('rotation');
    const yawRotation = radToDeg(this.lookControls.yawObject.rotation.y);

    const offset = (heading - (rotation - yawRotation)) % FULL_CIRCLE_DEG;
    this.lookControls.yawObject.rotation.y = degToRad(offset);
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

  private _initWatchPosition() {
    if (this.isEmulated) {
      this.getEmulatedPosition();
      return;
    }

    this.watchPositionId = this._watchPosition();
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
      ...coords,
    };

    // If user specified an altitude, we'll use it
    if (this.simulateAltitude !== 0) localPosition.altitude = this.simulateAltitude;

    this.currentPosition = localPosition;

    const distanceMoved = haversineDist(this.lastPosition, this.currentPosition);

    // If the user has moved more than the min distance, we'll update the position
    if (distanceMoved >= this.gpsMinDistance || !this.originPosition) {
      this._updatePosition();
      this.lastPosition = Helper.deepClone(this.currentPosition);
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

  private _setPosition() {
    if (!this.originPosition) return;

    const position = this.camera.getAttribute('position');

    const dstCoords: HaversineParams = {
      longitude: this.currentPosition.longitude,
      latitude: this.originPosition.latitude,
    };

    const distance = this.controller.computeDistance(this.originPosition, dstCoords);

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
          position: this.currentPosition,
          origin: this.originPosition,
          message: 'Location updated',
        },
      })
    );
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

export { CameraTracker };
