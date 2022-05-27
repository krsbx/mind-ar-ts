interface ControllerConstructor {
  simulateLatitude: number;
  simulateLongitude: number;
  simulateAltitude: number;
  positionMinAccuracy: number;
  minDistance: number;
  maxDistance: number;
  gpsMinDistance: number;
  gpsTimeInterval: number;
}

type Coordinates = {
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  latitude: number;
  longitude: number;
};

export type { ControllerConstructor, Coordinates };
