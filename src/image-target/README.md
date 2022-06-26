# Mind AR TS - Image Target

<p align="center"><img width="400" alt="image-target" src="https://hiukim.github.io/mind-ar-js-doc/assets/images/interactive-demo-1ab348a381cbd808f4d52c8750524d11.gif"></p>

Track compiled `image target` from `compiler` using `Image Target` components.

## Properties

### Image Target

| Property    | Description                    | Default value |
| ----------- | ------------------------------ | ------------- |
| targetIndex | Index of compiled target image | number        |

### Image

| Property                       | Description                                                            | Default value |
| ------------------------------ | ---------------------------------------------------------------------- | ------------- |
| imageTargetSrc                 | Source of the compiled image target                                    | -             |
| maxTrack                       | Maximum model to show                                                  | 1             |
| filterMinCF                    | Filter minimum cut-off                                                 | -1            |
| filterBeta                     | Filter beta                                                            | -1            |
| missTolerance                  | Maximum count for miss tracking before hiding the model                | -1            |
| warmupTolerance                | Maximum count for warming up the GPU to compile image target           | -1            |
| showStats                      | Determine wheter to show the status of the resources or not            | -1            |
| autoStart                      | Determine wheter autostart the AR or not                               | -1            |
| uiLoading, uiScanning, uiError | Show the corresponding UI                                              | yes           |
| reshowScanning                 | Determine wheter reshow the scanning UI after target image lost or not | true          |
| shouldFaceUser                 | Determine wheter use front camera or not                               | false         |
| \_positionSettings             | Set the position of the a-scene/video                                  | absolute      |
| \_positionZIndex               | Set the zIndex of the a-scene/video/ui overlay                         | -2            |
