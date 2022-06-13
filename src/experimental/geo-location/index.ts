import UI from '../../ui/ui';
import Controller from './controller';

const geoLocation = {
  Controller,
  UI,
};

if (!window.MINDAR) window.MINDAR = {} as typeof window.MINDAR;

if (!window.MINDAR.LOCATION) window.MINDAR.LOCATION = geoLocation as typeof window.MINDAR.LOCATION;

if (!window.MINDAR.LOCATION.UI) window.MINDAR.LOCATION.UI = UI as typeof window.MINDAR.LOCATION.UI;
if (!window.MINDAR.LOCATION.Controller)
  window.MINDAR.LOCATION.Controller = Controller as typeof window.MINDAR.LOCATION.Controller;

export default geoLocation;
