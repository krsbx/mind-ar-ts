// * We split the tracker into 2 parts:
// * 1. The camera
// * 2. The location/place

import { Scene } from 'aframe';
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

  constructor({
    location,
    latitude,
    longitude,
    controller,
    camera,
    placeIndex,
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

  private _getCamera() {
    if (!this.controller) return;

    const camera = this.controller.camera;
    if (!camera) return 'Location camera not found';

    this.camera = camera.camera;
    return;
  }

  private _onPositionSet() {
    if (!this.camera) {
      const res = this._getCamera();

      if (res) {
        console.error(res);
        return;
      }
    }

    this._updatePosition();
  }

  private _onPositionUpdate(ev: Event) {
    if (!this.camera || !this.controller) return;

    const dstCoords = {
      longitude: this.longitude,
      latitude: this.latitude,
    };

    const distanceMsg = this.controller.computeDistance(ev.detail.position, dstCoords);

    this.location.setAttribute('distance', distanceMsg);
    this.location.setAttribute('distanceMsg', formatDistance(distanceMsg));
    window.dispatchEvent(
      new CustomEvent(AR_EVENT_NAME.LOCATION_UPDATE_POSITION, {
        detail: {
          distance: distanceMsg,
        },
      })
    );

    const distance = this.controller.computeDistance(ev.detail.position, dstCoords, true);

    this.hideForMinDistance(distance === Number.MAX_SAFE_INTEGER);
  }

  private _updatePosition() {
    if (!this.controller || !this.controller.camera) return;

    if (!this.controller.camera.originPosition) return;

    const originPosition = this.controller.camera.originPosition;

    const position = {
      x: 0,
      y: this.location.getAttribute('position').y ?? 0,
      z: 0,
    };

    const dstCoordsX: HaversineParams = {
      longitude: this.longitude,
      latitude: originPosition.latitude,
    };

    const dstCoordsZ: HaversineParams = {
      longitude: originPosition.longitude,
      latitude: this.latitude,
    };

    position.x = this.controller.computeDistance(originPosition, dstCoordsX);
    position.x *= getPositionMultiplier(originPosition, this.position, AR_POSITION_MULTIPLIER.X);

    position.z = this.controller.computeDistance(originPosition, dstCoordsZ);
    position.z *= getPositionMultiplier(originPosition, this.position, AR_POSITION_MULTIPLIER.Z);

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
