// * We split the tracker into 2 parts:
// * 1. The camera
// * 2. The location/place

import { Scene } from 'aframe';
import { Helper } from '../../libs';
import { Controller } from '../controller';
import { AR_EVENT_NAME, AR_POSITION_MULTIPLIER } from '../utils/constant';
import { formatDistance, getPositionMultiplier } from '../utils/distance';
import { HaversineParams, LocationTrackerConstructor } from '../utils/types/geo-location';

class LocationTracker {
  private controller: Controller;
  private camera!: Scene;
  private location: Scene;
  private latitude: number;
  private longitude: number;
  private position: HaversineParams;
  private wasFound: boolean;
  private placeIndex: number;
  // * We add a custom distance for specific location
  // * by doing this, user can have a better experience
  // * since multiple location can be visible at different distance
  private minDistance: number;
  private maxDistance: number;

  constructor({
    location,
    latitude,
    longitude,
    controller,
    camera,
    placeIndex,
    minDistance = -1,
    maxDistance = -1,
  }: LocationTrackerConstructor) {
    this.location = location;
    this.latitude = latitude;
    this.longitude = longitude;
    this.controller = controller;
    this.camera = camera;
    this.position = {
      latitude,
      longitude,
    };
    this.minDistance = minDistance;
    this.maxDistance = maxDistance;
    this.placeIndex = placeIndex;

    this.wasFound = false;

    window.addEventListener(AR_EVENT_NAME.CAMERA_ORIGIN_SET, this._onPositionSet.bind(this));
    window.addEventListener(AR_EVENT_NAME.LOCATION_UPDATED, this._onPositionUpdate.bind(this));
    window.dispatchEvent(
      new CustomEvent(AR_EVENT_NAME.LOCATION_PLACE_ADDED, {
        detail: {
          location,
        },
      })
    );
  }

  private _onPositionSet() {
    if (!this.camera) {
      console.error('Location camera not found');
      return;
    }

    this._updatePosition();
  }

  private _onPositionUpdate(ev: Event) {
    if (!this.camera || !this.controller) return;

    if (!ev.detail.position) return;

    const distanceToCompute = {
      src: ev.detail.position,
      dest: this.position,
    };

    const distanceMsg = this.controller.computeDistance(distanceToCompute);

    this.location.setAttribute('distance', distanceMsg);
    this.location.setAttribute('distanceMsg', formatDistance(distanceMsg));
    window.dispatchEvent(
      new CustomEvent(AR_EVENT_NAME.LOCATION_UPDATE_POSITION, {
        detail: {
          distance: distanceMsg,
        },
      })
    );

    const distance = this.controller.computeDistance({
      ...distanceToCompute,
      minDistance: this.minDistance,
      maxDistance: this.maxDistance,
      isPlace: true,
    });

    this.hideForMinDistance(distance === Number.MAX_SAFE_INTEGER);
  }

  private _updatePosition() {
    if (!this.controller || !this.camera) return;

    if (!this.controller.camera.originPosition) return;

    const originPosition = Helper.deepClone(this.controller.camera.originPosition);

    const position = {
      x: 0,
      y: this.location.getAttribute('position').y ?? 0,
      z: 0,
    };

    // Compute X Axis
    const dstCoordsX: HaversineParams = {
      longitude: this.longitude,
      latitude: originPosition.latitude,
    };

    const distanceX = this.controller.computeDistance({
      src: originPosition,
      dest: dstCoordsX,
    });

    position.x = distanceX;
    position.x *= getPositionMultiplier(originPosition, this.position, AR_POSITION_MULTIPLIER.X);

    // Compute Z Axis
    const dstCoordsZ: HaversineParams = {
      longitude: originPosition.longitude,
      latitude: this.latitude,
    };

    const distanceZ = this.controller.computeDistance({
      src: originPosition,
      dest: dstCoordsZ,
    });

    position.z = distanceZ;
    position.z *= getPositionMultiplier(originPosition, this.position, AR_POSITION_MULTIPLIER.Z);

    if (position.y !== 0) {
      const altitude = originPosition.altitude ?? 0;
      position.y -= altitude;
    }

    this.location.setAttribute('position', position);
  }

  hideForMinDistance(value: boolean) {
    this._triggerLostFoundEvent(!value);
    this.location.setAttribute('visible', !value);
  }

  private _triggerLostFoundEvent(isVisible: boolean) {
    if (isVisible && !this.wasFound) {
      this.location.emit(AR_EVENT_NAME.LOCATION_FOUND, {
        distance: this.location.getAttribute('distance'),
        distanceMsg: this.location.getAttribute('distanceMsg'),
        placeIndex: this.placeIndex,
        time: new Date().getTime(),
      });
      this.wasFound = true;
    }

    if (!isVisible && this.wasFound) {
      this.location.emit(AR_EVENT_NAME.LOCATION_LOST, {
        placeIndex: this.placeIndex,
        time: new Date().getTime(),
      });
      this.wasFound = false;
    }
  }
}

export { LocationTracker };
