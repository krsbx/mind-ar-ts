import './style.css';

const app = document.querySelector('#app') as unknown as HTMLDivElement;

const SCENE = `
  <a-scene mindar-image="imageTargetSrc: https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.1.4/examples/image-tracking/assets/card-example/card.mind;" vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false">
    <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
    <a-entity mindar-image-target="targetIndex: 0">
      <a-plane color="blue" opaciy="0.5" position="0 0 0" height="0.552" width="1" rotation="0 0 0"></a-plane>
    </a-entity>
  </a-scene>
`;

app.innerHTML = `
  <h1>Hello Mind AR J/TS!</h1>
  ${SCENE}
`;

app.style.margin = '0';
