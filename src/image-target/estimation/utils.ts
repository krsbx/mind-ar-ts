export const buildModelViewProjectionTransform = (
  projectionTransform: number[][],
  modelViewTransform: number[][]
) => {
  // assume the projectTransform has the following format:
  // [[fx, 0, cx],
  //  [0, fy, cy]
  //  [0, 0, 1]]
  const modelViewProjectionTransform = [
    [
      projectionTransform[0][0] * modelViewTransform[0][0] +
        projectionTransform[0][2] * modelViewTransform[2][0],
      projectionTransform[0][0] * modelViewTransform[0][1] +
        projectionTransform[0][2] * modelViewTransform[2][1],
      projectionTransform[0][0] * modelViewTransform[0][2] +
        projectionTransform[0][2] * modelViewTransform[2][2],
      projectionTransform[0][0] * modelViewTransform[0][3] +
        projectionTransform[0][2] * modelViewTransform[2][3],
    ],
    [
      projectionTransform[1][1] * modelViewTransform[1][0] +
        projectionTransform[1][2] * modelViewTransform[2][0],
      projectionTransform[1][1] * modelViewTransform[1][1] +
        projectionTransform[1][2] * modelViewTransform[2][1],
      projectionTransform[1][1] * modelViewTransform[1][2] +
        projectionTransform[1][2] * modelViewTransform[2][2],
      projectionTransform[1][1] * modelViewTransform[1][3] +
        projectionTransform[1][2] * modelViewTransform[2][3],
    ],
    [
      modelViewTransform[2][0],
      modelViewTransform[2][1],
      modelViewTransform[2][2],
      modelViewTransform[2][3],
    ],
  ];

  return modelViewProjectionTransform;
};

export const applyModelViewProjectionTransform = (
  modelViewProjectionTransform: number[][],
  x: number,
  y: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _z = 0
) => {
  // assume z is zero
  const ux =
    modelViewProjectionTransform[0][0] * x +
    modelViewProjectionTransform[0][1] * y +
    modelViewProjectionTransform[0][3];
  const uy =
    modelViewProjectionTransform[1][0] * x +
    modelViewProjectionTransform[1][1] * y +
    modelViewProjectionTransform[1][3];
  const uz =
    modelViewProjectionTransform[2][0] * x +
    modelViewProjectionTransform[2][1] * y +
    modelViewProjectionTransform[2][3];
  return { x: ux, y: uy, z: uz };
};

export const computeScreenCoordiate = (
  modelViewProjectionTransform: number[][],
  x: number,
  y: number,
  z = 0
) => {
  const result = applyModelViewProjectionTransform(modelViewProjectionTransform, x, y, z);

  const { x: ux, y: uy, z: uz } = result;

  return { x: ux / uz, y: uy / uz };
};
