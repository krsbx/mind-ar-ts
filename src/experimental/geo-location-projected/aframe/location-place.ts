import { Entity, Schema } from 'aframe';
import { BaseComponent, toComponent } from 'aframe-typescript-class-components';
import { AR_COMPONENT_NAME, AR_EVENT_NAME } from '../../../geo-location/utils/constant';
import { formatDistance } from '../../../geo-location/utils/distance';
import { IMindARLocationPlace } from './aframe';
import { MindARLocationCamera } from './location-camera';

class MindARLocationPlace extends BaseComponent<IMindARLocationPlace> {
  gpsCamera!: MindARLocationCamera;

  static schema: Schema<IMindARLocationPlace> = {
    longitude: { type: 'number', default: 0 },
    latitude: { type: 'number', default: 0 },
  };

  public init() {
    window.addEventListener(AR_EVENT_NAME.CAMERA_ORIGIN_SET, this._getGPSCamera.bind(this));
    window.addEventListener(AR_EVENT_NAME.LOCATION_UPDATED, this._onPositionUpdate.bind(this));

    window.dispatchEvent(
      new CustomEvent(AR_EVENT_NAME.LOCATION_PLACE_ADDED, {
        detail: {
          location: this.el as any,
        },
      })
    );
  }

  private _getGPSCamera() {
    if (this.gpsCamera) return;

    const camera = document.querySelector(`[${AR_COMPONENT_NAME.LOCATION_CAMERA}]`);

    if (!camera.components[AR_COMPONENT_NAME.LOCATION_CAMERA]) {
      console.error('AR Camera not found!');
      return;
    }

    this.gpsCamera = camera.components[AR_COMPONENT_NAME.LOCATION_CAMERA];
    this._updatePosition();
  }

  private _onPositionUpdate() {
    if (!this.data || !this.gpsCamera) return;

    const dstCoords = this.el.getAttribute('position');

    const distanceForMsg = this.gpsCamera.computeDistanceMeters(dstCoords);

    this.el.setAttribute('distance', distanceForMsg);
    this.el.setAttribute('distanceMsg', formatDistance(distanceForMsg));

    this.el.dispatchEvent(
      new CustomEvent(AR_EVENT_NAME.LOCATION_UPDATE_POSITION, {
        detail: { distance: distanceForMsg },
      })
    );

    const actualDistance = this.gpsCamera.computeDistanceMeters(dstCoords, true);

    this.hideForDistances(this.el, actualDistance === Number.MAX_SAFE_INTEGER);
  }

  private _updatePosition() {
    const worldPos = this.gpsCamera.latLonToWorld(this.data.latitude, this.data.longitude);
    const position = this.el.getAttribute('position');

    // update element's position in 3D world
    //this.el.setAttribute('position', position);
    this.el.setAttribute('position', {
      x: worldPos.x,
      y: position.y,
      z: worldPos.z,
    });
  }

  public hideForDistances(el: Entity, isVisible: boolean) {
    el.setAttribute('visible', !isVisible);
  }
}

AFRAME.registerComponent(AR_COMPONENT_NAME.LOCATION_PLACE, toComponent(MindARLocationPlace));
