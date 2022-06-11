import { ICompilerData } from '../../image-target/utils/types/compiler';

declare class Compiler {
  private data;
  constructor();
  compileImageTargets(
    images: (HTMLImageElement | ImageBitmap)[],
    progressCallback: (progress: number) => void
  ): Promise<ICompilerData[]>;
  exportData(): Uint8Array;
  importData(buffer: ArrayBuffer): ICompilerData[];
  private _extractMatchingFeatures;
}

export default Compiler;
