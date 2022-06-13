import Controller from './controller';
import UI from '../ui/ui';

const faceTarget = {
  Controller,
  UI,
};

if (!window.MINDAR) window.MINDAR = {} as typeof window.MINDAR;

if (!window.MINDAR.FACE) window.MINDAR.FACE = faceTarget as typeof window.MINDAR.FACE;

if (!window.MINDAR.FACE.Controller)
  window.MINDAR.FACE.Controller = Controller as typeof window.MINDAR.FACE.Controller;
if (!window.MINDAR.FACE.UI) window.MINDAR.IMAGE.UI = UI as typeof window.MINDAR.FACE.UI;

export default faceTarget;
