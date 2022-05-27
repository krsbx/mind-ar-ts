import { degToRad } from './common';
import { EARTH_RADIUS } from './constant';
import { Coordinates } from './types/geo-location';

const formatDistance = (distance: number) => {
  const dist = parseInt(distance.toFixed(0), 10);

  if (dist >= 1000) return `${(dist / 1000).toFixed(1)} km`;
  return `${dist} m`;
};

/**
 * Haversine formula to calculate the distance between two points
 * http://www.movable-type.co.uk/scripts/latlong.html#distance
 */
const haversineDist = (src: Coordinates, dest: Coordinates) => {
  const deltaLon = degToRad(dest.longitude - src.longitude);
  const deltaLat = degToRad(dest.latitude - src.latitude);

  const srcCosLatitude = Math.cos(degToRad(src.latitude));
  const destCosLatitude = Math.cos(degToRad(dest.latitude));

  const sinDeltaLat = Math.sin(deltaLat / 2);
  const sinDeltaLon = Math.sin(deltaLon / 2);

  const sqrSinDeltaLat = sinDeltaLat ** 2;
  const sqrSinDeltaLon = sinDeltaLon ** 2;

  const result = sqrSinDeltaLat + srcCosLatitude * destCosLatitude * sqrSinDeltaLon;

  const angle = 2 * Math.atan2(Math.sqrt(result), Math.sqrt(1 - result));

  return angle * EARTH_RADIUS; // Resulting in metric units (meters)
};

export { formatDistance, haversineDist };
