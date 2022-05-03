import { Controller } from './controller';
import { Compiler } from './compiler';
import { UI } from '../ui/ui';
import { MindARThree } from './three';

const imageTarget = {
  Controller,
  Compiler,
  UI,
  MindARThree,
};

if (!window.MINDAR) window.MINDAR = {} as typeof window.MINDAR;

if (!window.MINDAR.IMAGE) window.MINDAR.IMAGE = imageTarget as typeof window.MINDAR.IMAGE;
else
  window.MINDAR.IMAGE = {
    ...window.MINDAR.IMAGE,
    ...imageTarget,
  };

export default imageTarget;
