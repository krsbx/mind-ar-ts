import './style.css';
import { EXAMPLE } from './utils/constant';

const app = document.querySelector('#app') as unknown as HTMLDivElement;

const SCENE = EXAMPLE.IMAGE_TARGET;

app.innerHTML = `
  <h1>Hello Mind AR J/TS!</h1>
  ${SCENE}
`;

app.style.margin = '0';
