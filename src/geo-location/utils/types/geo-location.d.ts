import { AScene } from 'aframe';

interface ControllerConstructor {
  simulateLatitude: number;
  simulateLongitude: number;
  simulateAltitude: number;
  positionMinAccuracy: number;
  minDistance: number;
  maxDistance: number;
  gpsMinDistance: number;
  gpsTimeInterval: number;
  camera: typeof AScene;
}

type Coordinates = {
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  latitude: number;
  longitude: number;
};

type HaversineParams = Pick<Coordinates, 'latitude' | 'longitude'>;

export type { ControllerConstructor, Coordinates, HaversineParams };
