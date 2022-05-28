import { UI } from '../ui/ui';
import { Controller } from './controller';
import { Tracker } from './tracker';

const geoLocation = {
  Controller,
  UI,
};

if (!window.MINDAR) window.MINDAR = {} as typeof window.MINDAR;

if (!window.MINDAR.LOCATION) window.MINDAR.LOCATION = geoLocation as typeof window.MINDAR.LOCATION;

if (!window.MINDAR.LOCATION.UI) window.MINDAR.LOCATION.UI = UI;
if (!window.MINDAR.LOCATION.Controller) window.MINDAR.LOCATION.Controller = Controller;
if (!window.MINDAR.LOCATION.Tracker) window.MINDAR.LOCATION.Tracker = Tracker;

export default geoLocation;
