import { FaceMesh, InputImage, Results } from '@mediapipe/face_mesh';

class FaceMeshHelper {
  private faceMesh: FaceMesh;
  private detectResolve: ((results: Results) => void) | null;

  constructor() {
    this.detectResolve = null;

    this.faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.faceMesh.onResults((results) => {
      this.detectResolve?.(results);
    });
  }

  public async detect(input: InputImage) {
    const results = await new Promise<Results>((resolve) => {
      this.detectResolve = resolve;

      this.faceMesh.send({ image: input });
    });

    return results;
  }
}

export default FaceMeshHelper;
