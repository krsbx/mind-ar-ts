export interface IMindARLocationCamera {
  simulateAltitude: number;
  simulateLatitude: number;
  simulateLongitude: number;
  positionMinAccuracy: number;
  minDistance: number;
  gpsMinDistance: number;
  gpsTimeInterval: number;
}

export interface IMindARLocationPlace {
  longitude: number;
  latitude: number;
}
