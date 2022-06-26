# Mind AR TS - A-Frame Gestures

This A-Frame Gestures is taken and modified from [AR.js Gestures](https://github.com/fcor/arjs-gestures).

<p align="center"><img width="400" alt="gesture sample" src="https://user-images.githubusercontent.com/21111451/83983551-00accd00-a8f5-11ea-80a6-e075971ba1d2.gif"></p>

A-Frame Gestures for Mind AR TS. This work is based on [AR.js Gestures](https://github.com/fcor/arjs-gestures) from [@fcor](https://github.com/fcor) and [this example](https://github.com/8thwall/web/blob/master/examples/aframe/manipulate/README.md) from 8th Wall.

Detect any gesture or mouse action on your Mind AR TS Scene using `gesture-detector` and `mouse-detector` components. Scale and rotate 3D elements from your Mind AR TS scene using `gesture-rotation`, `gesture-scale`, `mouse-rotation`, and `mouse-scale` for scaling and rotating the model in AR Scene.

## Properties

### Gesture/Mouse Detector

| Property | Description                           | Default value |
| -------- | ------------------------------------- | ------------- |
| enabled  | Enable detecting gesture/mouse action | true          |

### Gesture/Mouse Rotation

| Property       | Description             | Default value |
| -------------- | ----------------------- | ------------- |
| enabled        | Enable rotation         | true          |
| rotationFactor | Multiplier for rotation | 5             |

### Gesture/Mouse Scale

| Property | Description                 | Default value |
| -------- | --------------------------- | ------------- |
| enabled  | Enable scaling              | true          |
| minScale | Minimal scale of the entity | 0.3           |
| maxScale | Maximum scale of the entity | 8             |
