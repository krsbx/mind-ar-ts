import { BufferGeometry, BufferAttribute } from 'three';
import { uvs, faces } from './face-data';

const N_LANDMARKS = uvs.length;

class FaceGeometry extends BufferGeometry {
  private positions: Float32Array;
  private uvs: Float32Array;

  constructor() {
    super();

    this.positions = new Float32Array(N_LANDMARKS * 3);
    this.uvs = new Float32Array(N_LANDMARKS * 2);

    this.setAttribute('position', new BufferAttribute(this.positions, 3));
    this.setAttribute('uv', new BufferAttribute(this.uvs, 2));

    this.setUvs();

    this.setIndex(faces);
  }

  setUvs() {
    for (let j = 0; j < N_LANDMARKS; j++) {
      this.uvs[j * 2] = uvs[j][0];
      this.uvs[j * 2 + 1] = uvs[j][1];
    }

    this.getAttribute('uv').needsUpdate = true;
  }

  updatePositions(landmarks: number[][]) {
    for (let i = 0; i < N_LANDMARKS; i++) {
      this.positions[i * 3 + 0] = landmarks[i][0];
      this.positions[i * 3 + 1] = landmarks[i][1];
      this.positions[i * 3 + 2] = landmarks[i][2];
    }

    this.attributes.position.needsUpdate = true;

    this.computeVertexNormals();
  }
}

export default FaceGeometry;
