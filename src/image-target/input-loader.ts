import {
  TensorInfo,
  backend as tfBackend,
  browser as tfBrowser,
  tidy as tfTidy,
  env as tfEnv,
  engine as tfEngine,
} from '@tensorflow/tfjs';
import { Helper } from '../libs';

// More efficient implementation for tf.browser.fromPixels
//   original implementation: /node_modules/@tensorflow/tfjs-backend-webgl/src/kernels/FromPixels.ts
//
// This implementation return grey scale instead of RGBA in the orignal implementation
class InputLoader {
  private width: number;
  private height: number;
  private textShape: number[];
  private context: CanvasRenderingContext2D;
  private tempPixelHandle: TensorInfo;
  private program: any;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.textShape = [height, width];

    const canvas = Helper.castTo<HTMLCanvasElement>(document.createElement('canvas'));

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.canvas.width = width;
    context.canvas.height = height;
    this.context = context;

    this.program = this.buildProgram(width, height);

    const backend = tfBackend() as any;

    this.tempPixelHandle = backend.makeTensorInfo(this.textShape, 'float32');
    // warning!!!
    // usage type should be TextureUsage.PIXELS, but tfjs didn't export this enum type, so we hard-coded 2 here
    //   i.e. backend.texData.get(tempPixelHandle.dataId).usage = TextureUsage.PIXELS;
    backend.texData.get(this.tempPixelHandle.dataId).usage = 2;
  }

  // old method
  _loadInput(input: ImageData) {
    return tfTidy(() => {
      const inputImage = tfBrowser.fromPixels(input).mean(2);

      return inputImage;
    });
  }

  // input is instance of HTMLVideoElement or HTMLImageElement
  loadInput(input: CanvasImageSource) {
    this.context.drawImage(input, 0, 0, this.width, this.height);

    const backend = tfBackend() as any;

    backend.gpgpu.uploadPixelDataToTexture(
      backend.getTexture(this.tempPixelHandle.dataId),
      this.context.canvas
    );

    const res = this._compileAndRun(this.program, [this.tempPixelHandle]);

    return res;
  }

  buildProgram(width: number, height: number) {
    const textureMethod = tfEnv().getNumber('WEBGL_VERSION') === 2 ? 'texture' : 'texture2D';

    const program = {
      variableNames: ['A'],
      outputShape: this.textShape,
      userCode: `
	void main() {
	  ivec2 coords = getOutputCoords();
	  int texR = coords[0];
	  int texC = coords[1];
	  vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${width}.0, ${height}.0);

	  vec4 values = ${textureMethod}(A, uv);
	  setOutput((0.299 * values.r + 0.587 * values.g + 0.114 * values.b) * 255.0);
	}
      `,
    };

    return program;
  }

  _compileAndRun(program: any, inputs: TensorInfo[]) {
    const outInfo = (tfBackend() as any).compileAndRun(program, inputs);

    return tfEngine().makeTensorFromTensorInfo(outInfo);
  }
}

export { InputLoader };
