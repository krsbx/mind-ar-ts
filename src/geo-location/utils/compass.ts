/**
 * Compute the compass heading from the device orientation
 * https://w3c.github.io/deviceorientation/spec-source-orientation.html#worked-example
 */

import { degToRad, radToDeg } from 'three/src/math/MathUtils';

const computeCompassHeading = (alpha: number, beta: number | null, gamma: number | null) => {
  const alphaRad = degToRad(alpha);
  const betaRad = degToRad(beta ?? alpha);
  const gammaRad = degToRad(gamma ?? alpha);

  const cosAlpha = Math.cos(alphaRad);
  const sinAlpha = Math.sin(alphaRad);

  const sinBeta = Math.sin(betaRad);

  const cosGamma = Math.cos(gammaRad);
  const sinGamma = Math.sin(gammaRad);

  const sinBetaCosGamma = sinBeta * cosGamma;

  const rotA = -cosAlpha * sinGamma - sinAlpha * sinBetaCosGamma;
  const rotB = -sinAlpha * sinGamma + cosAlpha * sinBetaCosGamma;

  let heading = Math.atan(rotA / rotB);

  // Convert heading to whole unit circle
  if (rotB < 0) heading += Math.PI;
  if (rotA < 0) heading += Math.PI * 2;

  // Convert the result to degrees
  return radToDeg(heading);
};

const getHeading = (event: DeviceOrientationEvent) => {
  const hasCompassHeading = !!event.webkitCompassHeading;
  const hasWebKitAccuracy = !!event.webkitCompassAccuracy;

  if (!hasCompassHeading || !hasWebKitAccuracy) return;

  if ((event?.webkitCompassAccuracy ?? Number.POSITIVE_INFINITY) > 50) return;

  return event.webkitCompassHeading ?? 0;
};

export { computeCompassHeading, getHeading };
