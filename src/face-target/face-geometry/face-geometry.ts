import { uvs, faces } from './face-data';

const nLandmarks = uvs.length;

const _createThreeFaceGeometry = (THREE: typeof AFRAME.THREE) => {
  class FaceGeometry extends THREE.BufferGeometry {
    private positions: Float32Array;
    private uvs: Float32Array;

    constructor() {
      super();

      this.positions = new Float32Array(nLandmarks * 3);
      this.uvs = new Float32Array(nLandmarks * 2);
      this.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
      this.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2));
      this.setUvs();
      this.setIndex(faces);
    }

    setUvs() {
      for (let j = 0; j < nLandmarks; j++) {
        this.uvs[j * 2] = uvs[j][0];
        this.uvs[j * 2 + 1] = uvs[j][1];
      }
      this.getAttribute('uv').needsUpdate = true;
    }

    updatePositions(landmarks: number[][]) {
      for (let i = 0; i < nLandmarks; i++) {
        this.positions[i * 3 + 0] = landmarks[i][0];
        this.positions[i * 3 + 1] = landmarks[i][1];
        this.positions[i * 3 + 2] = landmarks[i][2];
      }

      this.attributes.position.needsUpdate = true;
      this.computeVertexNormals();
    }
  }

  return new FaceGeometry();
};

export { _createThreeFaceGeometry };
