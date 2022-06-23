import { Schema } from 'aframe';
import { BaseComponent, toComponent } from 'aframe-typescript-class-components';
import { Helper } from '../../../libs';
import { IMindARLocationCamera } from './aframe';
import {
  AR_COMPONENT_NAME,
  AR_EVENT_NAME,
  FULL_CIRCLE_DEG,
} from '../../../geo-location/utils/constant';
import { Coordinates, HaversineParams } from '../../../geo-location/utils/types/geo-location';
import { computeCompassHeading, getHeading } from '../../../geo-location/utils/compass';
import { degToRad, radToDeg } from '../../../geo-location/utils/common';
import { haversineDist } from '../../../geo-location/utils/distance';

export class MindARLocationCamera extends BaseComponent<IMindARLocationCamera> {
  originPosition: Vector3 | null = null;
  lastPosition!: HaversineParams;
  currentPosition!: Coordinates;
  isEmulated!: boolean;
  lookControls!: any;
  heading: number | null = null;
  orientationEventName!: string;

  watchPositionId!: number | null;

  static schema: Schema<IMindARLocationCamera> = {
    simulateAltitude: { type: 'number', default: 0 },
    simulateLatitude: { type: 'number', default: 0 },
    simulateLongitude: { type: 'number', default: 0 },
    positionMinAccuracy: { type: 'int', default: 100 },
    minDistance: { type: 'int', default: 0 },
    gpsMinDistance: { type: 'number', default: 3 },
    gpsTimeInterval: { type: 'number', default: 3 },
  };

  public init() {
    if (!this.el.components['look-controls']) return;

    this.lookControls = this.el.components['look-controls'];

    this.lastPosition = {
      latitude: 0,
      longitude: 0,
    };

    this.orientationEventName = this._getDeviceOrientationEventName();

    if (this.orientationEventName === '') console.error('Compass is not supported');

    window.addEventListener(this.orientationEventName, this._onDeviceOrientation.bind(this), false);
  }

  public play() {
    if (this.data.simulateLatitude !== 0 && this.data.simulateLongitude !== 0) {
      const localPosition = Object.assign({}, this.currentPosition || {});
      localPosition.latitude = this.data.simulateLatitude;
      localPosition.longitude = this.data.simulateLongitude;

      if (this.data.simulateAltitude !== 0) localPosition.altitude = this.data.simulateAltitude;

      this.currentPosition = localPosition;
      this._updatePosition();
    } else {
      this._initWatchPosition();
    }
  }

  public pause() {
    if (this.watchPositionId) {
      navigator.geolocation.clearWatch(this.watchPositionId);
    }

    this.watchPositionId = null;
  }

  public update() {
    if (this.data.simulateLatitude !== 0 && this.data.simulateLongitude !== 0) {
      const localPosition = Object.assign({}, this.currentPosition || {});
      localPosition.longitude = this.data.simulateLongitude;
      localPosition.latitude = this.data.simulateLatitude;
      localPosition.altitude = this.data.simulateAltitude;
      this.currentPosition = localPosition;

      // re-trigger initialization for new origin
      this.originPosition = null;
      this._updatePosition();
    }
  }

  public tick() {
    if (this.heading === null) return;

    this._updateRotation();
  }

  private _initWatchPosition() {
    if (this.data.simulateLatitude !== 0 && this.data.simulateLongitude !== 0) return;

    this.watchPositionId = this._watchPosition();
  }

  private _watchPosition() {
    return navigator.geolocation.watchPosition(
      this._onPositionUpdate.bind(this),
      this._onPositionError.bind(this),
      {
        enableHighAccuracy: true,
        maximumAge: this.data.gpsTimeInterval,
        timeout: 27000,
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
    if (this.data.simulateAltitude !== 0) localPosition.altitude = this.data.simulateAltitude;

    this.currentPosition = localPosition;

    const distMoved = haversineDist(this.lastPosition, this.currentPosition);

    if (distMoved >= this.data.gpsMinDistance || !this.originPosition) {
      this._updatePosition();

      this.lastPosition = {
        longitude: this.currentPosition.longitude,
        latitude: this.currentPosition.latitude,
      };
    }
  }

  private _onPositionError() {
    if (this.watchPositionId) {
      navigator.geolocation.clearWatch(this.watchPositionId);
    }
  }

  private _updateRotation() {
    if (this.heading === null) return;

    const heading = FULL_CIRCLE_DEG - this.heading;
    const rotation = this.el.getAttribute('rotation').y;
    const yawRotation = radToDeg(this.lookControls.yawObject.rotation.y);

    const offset = (heading - (rotation - yawRotation)) % FULL_CIRCLE_DEG;
    this.lookControls.yawObject.rotation.y = degToRad(offset);
  }

  private _updatePosition() {
    // TODO: show a notification for the user when the accuracy is too low
    if (this.currentPosition.accuracy > this.data.positionMinAccuracy) return;

    if (!this.originPosition) {
      // first camera initialization
      // Now store originCoords as PROJECTED original lat/lon, so that
      // we can set the world origin to the original position in "metres"
      this.originPosition = this._project(
        this.currentPosition.latitude,
        this.currentPosition.longitude
      );

      this._setPosition();

      window.dispatchEvent(new CustomEvent(AR_EVENT_NAME.CAMERA_ORIGIN_SET));
    } else {
      this._setPosition();
    }
  }

  private _setPosition() {
    const position = this.el.getAttribute('position');

    const worldCoords = this.latLonToWorld(
      this.currentPosition.latitude,
      this.currentPosition.longitude
    );

    position.x = worldCoords.x;
    position.z = worldCoords.z;

    // update position
    this.el.setAttribute('position', position);

    // add the sphmerc position to the event (for testing only)
    window.dispatchEvent(
      new CustomEvent(AR_EVENT_NAME.LOCATION_UPDATED, {
        detail: {
          position: this.currentPosition,
          origin: this.originPosition,
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

  private _getDeviceOrientationEventName() {
    let eventName = '';

    if ('ondeviceorientationabsolute' in window) eventName = 'deviceorientationabsolute';
    else if ('ondeviceorientation' in window) eventName = 'deviceorientation';

    return eventName;
  }

  public computeDistanceMeters(dest: Vector3, isPlace = false) {
    const src = this.el.getAttribute('position');
    const dx = dest.x - src.x;
    const dz = dest.z - src.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // if function has been called for a place, and if it's too near and a min distance has been set,
    // return max distance possible - to be handled by the  method caller
    if (
      isPlace &&
      this.data.minDistance &&
      this.data.minDistance > 0 &&
      distance < this.data.minDistance
    ) {
      return Number.MAX_SAFE_INTEGER;
    }

    return distance;
  }

  public latLonToWorld(lat: number, lon: number) {
    const projected = this._project(lat, lon);
    // Sign of z needs to be reversed compared to projected coordinates
    return {
      x: projected.x - (this.originPosition?.x ?? 0),
      y: 0,
      z: -(projected.z - (this.originPosition?.z ?? 0)),
    } as Vector3;
  }

  private _project(lat: number, lon: number) {
    const HALF_EARTH = 20037508.34;

    // Convert the supplied coords to Spherical Mercator (EPSG:3857), also
    // known as 'Google Projection', using the algorithm used extensively
    // in various OpenStreetMap software.
    const y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360.0)) / (Math.PI / 180.0);
    return {
      x: (lon / 180.0) * HALF_EARTH,
      y: 0,
      z: (y * HALF_EARTH) / 180.0,
    } as Vector3;
  }
}

AFRAME.registerComponent(AR_COMPONENT_NAME.LOCATION_CAMERA, toComponent(MindARLocationCamera));
