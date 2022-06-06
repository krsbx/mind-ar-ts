// * We split the tracker into 2 parts:
// * 1. The camera
// * 2. The location/place

import { Scene } from 'aframe';
import { degToRad, radToDeg } from '../../../geo-location/utils/common';
import { computeCompassHeading, getHeading } from '../../../geo-location/utils/compass';
import { AR_EVENT_NAME, FULL_CIRCLE_DEG, SEC2MS } from '../../../geo-location/utils/constant';
import { haversineDist } from '../../../geo-location/utils/distance';
import {
  CameraTrackerConstructor,
  Coordinates,
  HaversineParams,
} from '../../../geo-location/utils/types/geo-location';
import { Helper } from '../../../libs';
import Controller from '../controller';

class CameraTracker {
  private controller: Controller;
  readonly simulateLatitude: number;
  readonly simulateLongitude: number;
  readonly simulateAltitude: number;
  readonly positionMinAccuracy: number;
  readonly minDistance: number;
  readonly maxDistance: number;
  readonly gpsMinDistance: number;
  readonly gpsTimeInterval: number;
  private watchPositionId!: number;
  private lastPosition: HaversineParams;
  private currentPosition!: Coordinates;
  private heading: number | null;
  public originPosition: Coordinates | null;
  readonly isEmulated: boolean;
  readonly camera: Scene;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly lookControls: any;
  readonly orientationEventName: string;

  constructor({
    camera,
    controller,
    gpsMinDistance = 0,
    gpsTimeInterval = 3,
    maxDistance = 0,
    minDistance = 3,
    positionMinAccuracy = 100,
    simulateAltitude = 0,
    simulateLatitude = 0,
    simulateLongitude = 0,
  }: CameraTrackerConstructor) {
    this.camera = camera;
    this.controller = controller as any;

    this.gpsMinDistance = gpsMinDistance;
    this.gpsTimeInterval = gpsTimeInterval;

    this.maxDistance = maxDistance;
    this.minDistance = minDistance;
    this.positionMinAccuracy = positionMinAccuracy;

    this.simulateAltitude = simulateAltitude;
    this.simulateLatitude = simulateLatitude;
    this.simulateLongitude = simulateLongitude;

    this.heading = null;
    this.originPosition = null;
    this.lastPosition = {
      latitude: 0,
      longitude: 0,
    };

    this.lookControls = camera.components['look-controls'];
    this.isEmulated = simulateLatitude !== 0 && simulateLongitude !== 0;

    this.orientationEventName = this._getDeviceOrientationEventName();

    if (this.orientationEventName === '') console.error('Compass is not supported');
    window.addEventListener(this.orientationEventName, this._onDeviceOrientation.bind(this));
  }

  public startAR() {
    this._initWatchPosition();
  }

  private _initWatchPosition() {
    if (this.isEmulated) {
      this.getEmulatedPosition();
      return;
    }

    this.watchPositionId = this._watchPosition();
  }

  // Need to trigger manually from the camera
  public updateRotation() {
    if (this.heading === null) return;

    const heading = FULL_CIRCLE_DEG - this.heading;
    const cameraRotation = this.camera.getAttribute('rotation').y;
    const yawRotation = radToDeg(this.lookControls.yawObject.rotation.y);

    const offset = (heading - (cameraRotation - yawRotation)) % FULL_CIRCLE_DEG;

    this.lookControls.yawObject.rotation.y = degToRad(offset);
  }

  public getEmulatedPosition() {
    const localPosition = Helper.deepClone(this.currentPosition);

    localPosition.longitude = this.simulateLongitude;
    localPosition.latitude = this.simulateLatitude;

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

    if (distanceMoved >= this.gpsMinDistance || !this.originPosition) {
      this._updatePosition();

      this.lastPosition = {
        longitude: this.currentPosition.longitude,
        latitude: this.currentPosition.latitude,
      };
    }
  }

  private _onPositionError() {
    navigator.geolocation.clearWatch(this.watchPositionId);

    console.error('Error getting position');
  }

  private _updatePosition() {
    // TODO: show a notification for the user when the accuracy is too low
    if (this.currentPosition.accuracy < this.positionMinAccuracy) return;

    // Set the origin position on initialization
    if (!this.originPosition) {
      this.originPosition = this.currentPosition;

      // Invoke any callback that subscribes to the CAMERA_ORIGIN_SET
      window.dispatchEvent(new CustomEvent(AR_EVENT_NAME.CAMERA_ORIGIN_SET));
    }

    this._setPosition();
  }

  private _setPosition() {
    if (!this.originPosition) return;

    const position = this.camera.getAttribute('position');

    let destPosition: HaversineParams = {
      longitude: this.currentPosition.longitude,
      latitude: this.originPosition.latitude,
    };

    position.x = this.controller.computeDistanceMeters(this.originPosition, destPosition);
    position.x *= this.currentPosition.longitude > this.originPosition.longitude ? 1 : -1;

    destPosition = {
      longitude: this.originPosition.longitude,
      latitude: this.currentPosition.latitude,
    };

    position.z = this.controller.computeDistanceMeters(this.originPosition, destPosition);
    position.z *= this.currentPosition.latitude > this.originPosition.latitude ? -1 : 1;

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

  private _getDeviceOrientationEventName() {
    let eventName = '';

    if ('ondeviceorientationabsolute' in window) eventName = 'deviceorientationabsolute';
    else if ('ondeviceorientation' in window) eventName = 'deviceorientation';

    return eventName;
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

export default CameraTracker;
