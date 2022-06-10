# :warning: Geo Location is under heavy development :warning:
Geo Location need to be re-written since the model keep following the camera and the development one can be found in [geo-location branch](https://github.com/krsbx/mind-ar-ts/tree/geo-location) or in the [experimental/geo-location](./src/experimental/geo-location).

# MindAR

---

## This Repo is a complete rewrite of MindAR in Typescript.

---

<img src="https://hiukim.github.io/mind-ar-js-doc/assets/images/multi-targets-demo-8b5fc868f6b0847a9818e8bf0ba2c1c3.gif" height="250"><img src="https://hiukim.github.io/mind-ar-js-doc/assets/images/interactive-demo-1ab348a381cbd808f4d52c8750524d11.gif" height="250"><img src="https://hiukim.github.io/mind-ar-js-doc/assets/images/face-tryon-demo-369c4ba701f1df2099ecf05c27f0c944.gif" height="250">

MindAR is a web augmented reality library. Highlighted features include:

:star: Support Image tracking and Face tracking. For Location or Fiducial-Markers Tracking, checkout [AR.js](https://github.com/AR-js-org/AR.js)

:star: Written in pure javascript, end-to-end from the underlying computer vision engine to frontend

:star: Utilize gpu (through webgl) and web worker for performance

:star: Developer friendly. Easy to setup. With AFRAME extension, you can create an app with only 10 lines of codes

# Target Images Compiler

You can compile your own target images right on the browser using this friendly Compiler tools.

https://hiukim.github.io/mind-ar-js-doc/tools/compile

<img src="https://hiukim.github.io/mind-ar-js-doc/assets/images/step2-9f3c4dcb8a2e60766d86f950d06929ea.png" width="300"/>

# Roadmaps

1. Supports more augmented reality features, like Geo Location, Hand Tracking, Body Tracking and Plane Tracking

1. Research on different state-of-the-arts algorithms to improve tracking accuracy and performance

1. More educational references.

# Contributions

I personally don't come from a strong computer vision background, and I'm having a hard time improving the tracking accuracy. I could really use some help from computer vision expert. Please reach out and discuss.

Also welcome javascript experts to help with the non-engine part, like improving the APIs and so.

If you are graphics designer or 3D artists and can contribute to the visual. Even if you just use MindAR to develop some cool applications, please show us!

Whatever you can think of. It's an opensource web AR framework for everyone!

# Development Guide

#### Directories explained

1. `/src` folder contains majority of the source code
2. `/out` folder contains the built library

#### To create a production build

run `> npm run build:prod`. `mindar-XXX.prod.js`, `mindar-XXX-aframe.prod.js`, and `mindar-XXX-three.prod.js` will be generated for each tracking type.

#### For development

run `> npm run dev`. This will observe any file changes in `src` folder and will update the code that being used in the `index.html` file.

The examples should run in desktop browser and they are just html files, so it's easy to start development. However, because it requires camera access, so you need a webcam. Also, you need to run the html file with some localhost web server. Simply opening the files won't work.

You most likely would want to test on mobile device as well. In that case, it's better if you could setup your development environment to be able to share your localhost webserver to your mobile devices. To do this just run `> npm run dev -- --host --https` and access the your desktop local using `https::your-desktop-ip:3000`.

#### webgl backend

This library utilize tensorflowjs (https://github.com/tensorflow/tfjs) for webgl backend. Yes, tensorflow is a machine learning library, but we didn't use it for machine learning! :) Tensorflowjs has a very solid webgl engine which allows us to write general purpose GPU application (in this case, our AR application).

The core detection and tracking algorithm is written with custom operations in tensorflowjs. They are like shaders program. It might looks intimidating at first, but it's actually not that difficult to understand.

# Credits

The computer vision idea is borrowed from artoolkit (i.e. https://github.com/artoolkitx/artoolkit5). Unfortunately, the library doesn't seems to be maintained anymore.

Face Tracking is based on mediapipe face mesh model (i.e. https://google.github.io/mediapipe/solutions/face_mesh.html)
