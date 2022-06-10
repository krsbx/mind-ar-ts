import {
  engine as tfEngine,
  backend as tfBackend,
  env as tfEnv,
  TensorInfo,
} from '@tensorflow/tfjs';
import { GPGPUProgram, MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl';
import { TextureUsage } from '@tensorflow/tfjs-backend-webgl/dist/tex_util';
import { Helper } from '../libs';

class InputLoader {
  private width: number;
  private height: number;
  private texShape: [number, number];
  private context: CanvasRenderingContext2D;
  private program: GPGPUProgram;
  private tempPixelHandle: TensorInfo;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.texShape = [height, width];

    const canvas = Helper.castTo<HTMLCanvasElement>(document.createElement('canvas'));

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.canvas.width = width;
    context.canvas.height = height;
    this.context = context;

    this.program = this.buildProgram(width, height);

    const backend = tfBackend() as MathBackendWebGL;

    //this.tempPixelHandle = backend.makeTensorInfo(this.texShape, 'int32');
    this.tempPixelHandle = backend.makeTensorInfo(this.texShape, 'float32');

    // warning!!!
    // usage type should be TextureUsage.PIXELS, but tfjs didn't export this enum type, so we hard-coded 2 here
    //   i.e. backend.texData.get(tempPixelHandle.dataId).usage = TextureUsage.PIXELS;
    backend.texData.get(this.tempPixelHandle.dataId).usage = TextureUsage.PIXELS;
  }

  // input is instance of HTMLVideoElement or HTMLImageElement
  public loadInput(input: CanvasImageSource) {
    this.context.drawImage(input, 0, 0, this.width, this.height);

    const backend = tfBackend() as MathBackendWebGL;
    backend.gpgpu.uploadPixelDataToTexture(
      backend.getTexture(this.tempPixelHandle.dataId),
      this.context.canvas
    );

    const res = this._compileAndRun(this.program, [this.tempPixelHandle]);
    return res;
  }

  public buildProgram(width: number, height: number) {
    const textureMethod = tfEnv().getNumber('WEBGL_VERSION') === 2 ? 'texture' : 'texture2D';

    const program = {
      variableNames: ['A'],
      outputShape: this.texShape,
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

  private _compileAndRun(program: GPGPUProgram, inputs: TensorInfo[]) {
    const outInfo = (tfBackend() as MathBackendWebGL).compileAndRun(program, inputs);
    return tfEngine().makeTensorFromTensorInfo(outInfo);
  }
}

export default InputLoader;
