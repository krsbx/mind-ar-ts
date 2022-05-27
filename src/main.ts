import './style.css';

const app = document.querySelector('#app') as unknown as HTMLDivElement;

const SCENE = `
  <a-scene mindar-face embedded vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false">
      <a-camera active="false" position="0 0 0"></a-camera>
      <a-entity mindar-face-target="anchorIndex: 1">
        <a-sphere color="green" radius="0.1"></a-sphere>
      </a-entity>
    </a-scene>
`;

app.innerHTML = `
  <h1>Hello Mind AR J/TS!</h1>
  ${SCENE}
`;

app.style.margin = '0';
