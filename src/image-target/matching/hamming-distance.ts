// Fast computation on number of bit sets
// Ref: https://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetParallel
const compute = (options: { v1: number[]; v2: number[] }) => {
  const { v1, v2 } = options;
  let d = 0;

  for (let i = 0; i < v1.length; i++) {
    const x = (v1[i] ^ v2[i]) >>> 0;

    d += bitCount(x);
  }

  return d;
};

const bitCount = (v: number) => {
  let c = v - ((v >> 1) & 0x55555555);

  c = ((c >> 2) & 0x33333333) + (c & 0x33333333);
  c = ((c >> 4) + c) & 0x0f0f0f0f;
  c = ((c >> 8) + c) & 0x00ff00ff;
  c = ((c >> 16) + c) & 0x0000ffff;

  return c;
};

export default compute;
