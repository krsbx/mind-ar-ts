import { InputImage, FaceMesh as MPFaceMesh, Results } from '@mediapipe/face_mesh';

class FaceMesh {
  #faceMesh: MPFaceMesh;
  #detectResolve: ((value: Results | PromiseLike<Results>) => void) | null;

  constructor(selfieMode?: boolean) {
    this.#detectResolve = null;

    this.#faceMesh = new MPFaceMesh({
      locateFile(path) {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${path}`;
      },
    });

    this.#faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      selfieMode: selfieMode,
    });

    this.#faceMesh.onResults((results) => {
      this.#detectResolve?.(results);
    });
  }

  async detect(input: InputImage) {
    const results = await new Promise<Results>((resolve) => {
      this.#detectResolve = resolve;

      this.#faceMesh.send({
        image: input,
      });
    });

    return results;
  }
}

export default FaceMesh;
