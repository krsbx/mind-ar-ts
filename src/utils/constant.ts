export const STATS_STYLE = 'position: absolute; top: 0px; left: 0px; z-index: 999';

export const VIDEO_ID = 'mindar-video';

export const GLOBAL_AR_EVENT_NAME = {
  SCREEN_RESIZE: 'resize',
  LOADED_METADATA: 'loadedmetadata',
};

export const AR_ELEMENT_TAG = {
  A_CAMERA: 'a-camera',
  A_ENTITY: 'a-entity',
  A_SCENE: 'a-scene',
  CAMERA: 'camera',
  MESH: 'mesh',
};

export const AR_STATE = {
  RENDER_START: 'renderstart',
  AR_ERROR: 'arError',
  AR_READY: 'arReady',
};

export const CONFIRMATION = {
  YES: 'yes',
  NO: 'no',
};

export const HIDDEN_CLASS_NAME = 'hidden';

export const PRODUCTION = 'production';

export const EXAMPLE = {
  FACE_TARGET: `
  <a-scene mindar-face embedded color-space="sRGB" renderer="colorManagement: true, physicallyCorrectLights" vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false">
    <a-assets>
      <a-asset-item id="headModel" src="assets/sparkar/headOccluder.glb"></a-asset-item>
      <a-asset-item id="glassesModel" src="assets/glasses/scene.gltf"></a-asset-item>
    </a-assets>
    <a-camera active="false" position="0 0 0" look-controls="enabled: false"></a-camera>
    <a-entity mindar-face-target="anchorIndex: 168">
      <a-gltf-model mindar-face-occluder position="0 -0.3 0.15"rotation="0 0 0" scale="0.065 0.065 0.065" src="#headModel"></a-gltf-model>
    </a-entity>
    <a-entity mindar-face-target="anchorIndex: 168">
      <a-gltf-model rotation="0 0 0" position="0 0.15 0" scale="0.008 0.01 0.01" src="#glassesModel"></a-gltf-model>
    </a-entity>
  </a-scene>
  `,
  IMAGE_TARGET: `
  <a-scene mindar-image="imageTargetSrc: https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.1.4/examples/image-tracking/assets/card-example/card.mind;" color-space="sRGB"
    renderer="colorManagement: true, physicallyCorrectLights" vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false" mouse-detector gesture-detector>
  <a-assets>
    <img id="card" src="https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.1.4/examples/image-tracking/assets/card-example/card.png" />
    <a-asset-item id="avatarModel" src="https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.1.4/examples/image-tracking/assets/card-example/softmind/scene.gltf"></a-asset-item>
  </a-assets>

  <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

  <a-entity mindar-image-target="targetIndex: 0">
    <a-entity mouse-rotation="rotationFactor: 5" gesture-rotation="rotationFactor: 2">
      <a-plane src="#card" position="0 0 0" height="0.552" width="1" rotation="0 0 0"></a-plane>
      <a-gltf-model rotation="0 0 0 " position="0 0 0.1" scale="0.005 0.005 0.005" src="#avatarModel"
      animation="property: position; to: 0 0.1 0.1; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate">
    </a-entity>
  </a-scene>
  `,
  GEO_LOCATION: `
  <a-scene
    mindar-location="showStats: true;"
    color-space="sRGB" renderer="colorManagement: true, physicallyCorrectLights" vr-mode-ui="enabled: false"
    device-orientation-permission-ui="enabled: false">
    <a-assets>
      <img id="card"
        src="https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.1.4/examples/image-tracking/assets/card-example/card.png" />
      <a-asset-item id="avatarModel" src="https://arjs-cors-proxy.herokuapp.com/https://raw.githack.com/AR-js-org/AR.js/master/aframe/examples/image-tracking/nft/trex/scene.gltf" />
    </a-assets>

    <a-camera mindar-location-camera="gpsMinDistance: 0; positionMinAccuracy: 0"></a-camera>

    <a-box material="color: yellow" mindar-location-place="latitude: 0; longitude: 0; placeIndex: 0"></a-box>

    <a-entity mindar-location-place="latitude: 0; longitude: 0; placeIndex: 1">
      <a-plane src="#card" position="0 0 0" height="0.552" width="1" rotation="0 0 0" />

      <a-gltf-model rotation="0 0 0 " position="0 0.6 0.1" scale="0.01 0.01 0.01" src="#avatarModel"
        animation="property: position; to: 0 0.1 0.1; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate" />
    </a-entity>
  </a-scene>
  `,
};
