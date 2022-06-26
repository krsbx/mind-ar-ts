# Mind AR TS - Face Target

<p align="center">
<img width="400" alt="face-target" src="https://hiukim.github.io/mind-ar-js-doc/assets/images/face-tryon-demo-369c4ba701f1df2099ecf05c27f0c944.gif"></p>

Track user `faces` from using `Face Target` components.

## Properties

### Face Target

| Property    | Description                    | Default value |
| ----------- | ------------------------------ | ------------- |
| anchorIndex | Index of compiled target image | number        |

### Face

| Property                       | Description                                    | Default value |
| ------------------------------ | ---------------------------------------------- | ------------- |
| filterMinCF                    | Filter minimum cut-off                         | -1            |
| filterBeta                     | Filter beta                                    | -1            |
| faceOccluder                   | Determine wheter add the faceOccluder or not   | true          |
| autoStart                      | Determine wheter autostart the AR or not       | -1            |
| uiLoading, uiScanning, uiError | Show the corresponding UI                      | yes           |
| shouldFaceUser                 | Determine wheter use front camera or not       | false         |
| \_positionSettings             | Set the position of the a-scene/video          | absolute      |
| \_positionZIndex               | Set the zIndex of the a-scene/video/ui overlay | -2            |
