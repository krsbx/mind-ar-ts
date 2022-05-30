import { Scene } from 'aframe';
import { Controller } from '../../controller';

interface ControllerConstructor {
  simulateLatitude: number;
  simulateLongitude: number;
  simulateAltitude: number;
  positionMinAccuracy: number;
  minDistance: number;
  maxDistance: number;
  gpsMinDistance: number;
  gpsTimeInterval: number;
  camera: Scene;
}

interface CameraTrackerConstructor {
  controller: Controller;
  simulateLatitude?: number;
  simulateLongitude?: number;
  simulateAltitude?: number;
  positionMinAccuracy?: number;
  minDistance?: number;
  maxDistance?: number;
  gpsMinDistance?: number;
  gpsTimeInterval?: number;
  camera: Scene;
}

interface LocationTrackerConstructor {
  latitude: number;
  longitude: number;
  controller: Controller;
  placeIndex: number;
  location: Scene;
  camera: Scene;
  minDistance?: number;
  maxDistance?: number;
}

type Coordinates = {
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  latitude: number;
  longitude: number;
};

type HaversineParams = Pick<Coordinates, 'latitude' | 'longitude'>;

export type {
  ControllerConstructor,
  Coordinates,
  HaversineParams,
  CameraTrackerConstructor,
  LocationTrackerConstructor,
};
