import { AComponent, AScene } from 'aframe';
import { Controller } from './controller';
import { AR_COMPONENT_NAME, AR_EVENT_NAME, AR_POSITION_MULTIPLIER } from './utils/constant';
import { formatDistance, getPositionMultiplier } from './utils/distance';
import { HaversineParams } from './utils/types/geo-location';

class Tracker {
  private camera!: typeof AComponent;
  private location: typeof AScene;
  private latitude: number;
  private longitude: number;
  private controller: Controller;
  private position: HaversineParams;

  constructor({
    location,
    latitude,
    longitude,
    controller,
  }: {
    location: typeof AScene;
    latitude: number;
    longitude: number;
    controller: Controller;
  }) {
    this.location = location;
    this.latitude = latitude;
    this.longitude = longitude;
    this.controller = controller;
    this.position = {
      latitude,
      longitude,
    };

    window.addEventListener(AR_EVENT_NAME.CAMERA_ORIGIN_SET, this._onPositionSet);
    window.addEventListener(AR_EVENT_NAME.LOCATION_UPDATED, this._onPositionUpdate);
  }

  private _getCamera() {
    const camera = document.querySelector(`[${AR_COMPONENT_NAME.LOCATION_CAMERA}]`);
    if (!camera) return 'Location camera not found';

    this.camera = (camera as typeof AScene).components[AR_COMPONENT_NAME.LOCATION_CAMERA];
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

    const { computeDistance } = this.controller;

    const dstCoords = {
      longitude: this.longitude,
      latitude: this.latitude,
    };

    const distanceMsg = computeDistance(ev.detail.position, dstCoords);

    this.location.setAttribute('distance', distanceMsg);
    this.location.setAttribute('distanceMsg', formatDistance(distanceMsg));
    window.dispatchEvent(
      new CustomEvent(AR_EVENT_NAME.LOCATION_UPDATE_POSITION, {
        detail: {
          distance: distanceMsg,
        },
      })
    );

    const distance = computeDistance(ev.detail.position, dstCoords, true);

    this.hideForMinDistance(distance === Number.MAX_SAFE_INTEGER);
  }

  private _updatePosition() {
    const { computeDistance, originPosition } = this.controller;

    if (!originPosition) return;

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

    position.x = computeDistance(originPosition, dstCoordsX);
    position.x *= getPositionMultiplier(originPosition, this.position, AR_POSITION_MULTIPLIER.X);

    position.z = computeDistance(originPosition, dstCoordsZ);
    position.z *= getPositionMultiplier(originPosition, this.position, AR_POSITION_MULTIPLIER.Z);

    this.location.setAttribute('position', position);
  }

  hideForMinDistance(value: boolean) {
    this.location.setAttribute('visible', !value);
  }
}

export { Tracker };
