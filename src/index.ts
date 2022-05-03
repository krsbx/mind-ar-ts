import { Controller } from './controller/image-target';
import { Compiler } from './compiler/image-target';
import { UI } from './ui/ui';
import { MindARThree } from './three/image-target';

const imageTarget = {
  Controller,
  Compiler,
  UI,
  MindARThree,
};

if (!window.MINDAR.IMAGE) window.MINDAR.IMAGE = imageTarget as typeof window.MINDAR.IMAGE;

export default imageTarget;
