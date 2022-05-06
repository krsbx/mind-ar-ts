import './style.css';

const app = document.querySelector('#app') as unknown as HTMLDivElement;

const SCENE = `
  <a-scene
    mindar-image="imageTargetSrc: https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.1.4/examples/image-tracking/assets/card-example/card.mind;"
    color-space="sRGB" renderer="colorManagement: true, physicallyCorrectLights" vr-mode-ui="enabled: false"
    device-orientation-permission-ui="enabled: false">
    <a-assets>
      <img id="card"
        src="https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.1.4/examples/image-tracking/assets/card-example/card.png" />
      <a-asset-item id="avatarModel" src="https://arjs-cors-proxy.herokuapp.com/https://raw.githack.com/AR-js-org/AR.js/master/aframe/examples/image-tracking/nft/trex/scene.gltf" />
    </a-assets>

    <a-camera position="0 0 0" look-controls="enabled: false" />

    <a-entity mindar-image-target="targetIndex: 0">
      <a-plane src="#card" position="0 0 0" height="0.552" width="1" rotation="0 0 0" />

      <a-gltf-model rotation="0 0 0 " position="0 0 0.1" scale="0.01 0.01 0.01" src="#avatarModel"
        animation="property: position; to: 0 0.1 0.1; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate" />
    </a-entity>
  </a-scene>
`;

app.innerHTML = `
  <h1>Hello Mind AR J/TS!</h1>
  ${SCENE}
`;

app.style.margin = '0';
