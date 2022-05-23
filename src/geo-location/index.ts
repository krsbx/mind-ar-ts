import { UI } from '../ui/ui';

const geoLocation = {
  UI,
};

if (!window.MINDAR) window.MINDAR = {} as typeof window.MINDAR;

if (!window.MINDAR.LOCATION) window.MINDAR.LOCATION = geoLocation as typeof window.MINDAR.LOCATION;

if (!window.MINDAR.LOCATION.UI) window.MINDAR.LOCATION.UI = UI;

export default geoLocation;
