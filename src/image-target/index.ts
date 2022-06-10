import Controller from './controller';
import Compiler from './compiler';
import { UI } from '../ui/ui';

const imageTarget = {
  Controller,
  Compiler,
  UI,
};

if (!window.MINDAR) window.MINDAR = {} as typeof window.MINDAR;

if (!window.MINDAR.IMAGE) window.MINDAR.IMAGE = imageTarget as typeof window.MINDAR.IMAGE;

if (!window.MINDAR.IMAGE.Controller) window.MINDAR.IMAGE.Controller = Controller;
if (!window.MINDAR.IMAGE.Compiler) window.MINDAR.IMAGE.Compiler = Compiler;
if (!window.MINDAR.IMAGE.UI) window.MINDAR.IMAGE.UI = UI;

export default imageTarget;
