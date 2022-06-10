/* eslint-disable @typescript-eslint/no-explicit-any */
// * We split the tracker into 2 parts:
// * 1. The camera
// * 2. The location/place

import { Scene } from 'aframe';
import { AR_EVENT_NAME } from '../../../geo-location/utils/constant';
import { formatDistance } from '../../../geo-location/utils/distance';
import {
  HaversineParams,
  LocationTrackerConstructor,
} from '../../../geo-location/utils/types/geo-location';
import Controller from '../controller';

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
  // private minDistance: number;
  // private maxDistance: number;

  constructor({
    camera,
    controller,
    latitude,
    location,
    longitude,
    placeIndex,
  }: LocationTrackerConstructor) {
    this.camera = camera;
    this.controller = controller as any;
    this.location = location;

    this.latitude = latitude;
    this.longitude = longitude;
    this.position = {
      latitude,
      longitude,
    };

    // * Clamp the min and max distances
    // * By doing this the min and max distance can't be lower than -1
    // this.minDistance = Math.max(-1, minDistance);
    // this.maxDistance = Math.max(-1, maxDistance);

    this.placeIndex = placeIndex;
    this.wasFound = false;

    // * Subscribe to the camera position set/update event
    // * The location object will be updated with the new position
    this.location.addEventListener(AR_EVENT_NAME.CAMERA_ORIGIN_SET, this._onPositionSet.bind(this));
    this.location.addEventListener(
      AR_EVENT_NAME.LOCATION_UPDATED,
      this._onPositionUpdate.bind(this)
    );

    // * Trigger the event when this location is added
    this.location.emit(AR_EVENT_NAME.LOCATION_PLACE_ADDED, {
      placeIndex,
      location,
    });
  }

  private _onPositionSet() {
    if (!this.camera) {
      console.error('Location camera not found');
      return;
    }

    this._updatePosition();
  }

  private _onPositionUpdate(event: Event) {
    if (!this.camera || !this.controller) return;

    if (!event.detail.position) return;

    // * Compute the distance between the current position and the location
    // * we use this distance for getting the actual distance between the location and the user/camera
    const distanceMsg = this.controller.computeDistanceMeters(event.detail.position, this.position);

    // * Set the distance and the distance message to the location properties
    this.location.setAttribute('distance', distanceMsg);
    this.location.setAttribute('distanceMsg', formatDistance(distanceMsg));

    // * We emit this if anyone want to listen to this event
    this.location.emit(AR_EVENT_NAME.LOCATION_UPDATE_POSITION, {
      placeIndex: this.placeIndex,
      distance: distanceMsg,
    });

    const distance = this.controller.computeDistanceMeters(
      event.detail.position,
      this.position,
      true
    );

    // * Hide the location if the distance is too far/close
    this.hideForMinDistance(distance === Number.MAX_SAFE_INTEGER);
  }

  private _updatePosition() {
    if (!this.controller || !this.camera) return;

    if (!this.controller.camera.originPosition) return;

    const originPosition = this.controller.camera.originPosition;

    const position = {
      x: 0,
      y: this.location.getAttribute('position').y ?? 0,
      z: 0,
    };

    let destPosition: HaversineParams = {
      longitude: this.longitude,
      latitude: originPosition.latitude,
    };

    position.x = this.controller.computeDistanceMeters(originPosition, destPosition);
    position.x *= this.longitude > originPosition.longitude ? 1 : -1;

    destPosition = {
      longitude: originPosition.longitude,
      latitude: this.latitude,
    };

    position.z = this.controller.computeDistanceMeters(originPosition, destPosition);
    position.z *= this.latitude > originPosition.latitude ? -1 : 1;

    if (position.y !== 0) {
      const altitude = originPosition.altitude ?? 0;
      position.y = position.y - altitude;
    }

    // * Update the location position
    this.location.setAttribute('position', position);
  }

  public hideForMinDistance(isVisible: boolean) {
    this._triggerLostFoundEvent(!isVisible);
    this.location.setAttribute('visible', !isVisible);
  }

  private _triggerLostFoundEvent(isVisible: boolean) {
    if (isVisible && !this.wasFound) {
      this.location.emit(AR_EVENT_NAME.LOCATION_FOUND, {
        distance: this.location.getAttribute('distance'),
        distanceMsg: this.location.getAttribute('distanceMsg'),
        placeIndex: this.placeIndex,
        time: new Date().getTime(),
      });
    }

    if (!isVisible && this.wasFound) {
      this.location.emit(AR_EVENT_NAME.LOCATION_LOST, {
        placeIndex: this.placeIndex,
        time: new Date().getTime(),
      });
    }

    this.wasFound = isVisible;
  }
}

export default LocationTracker;
