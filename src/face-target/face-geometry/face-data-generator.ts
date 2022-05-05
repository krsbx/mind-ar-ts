// canonical-face-model.obj source:
// https://github.com/google/mediapipe/tree/master/mediapipe/modules/face_geometry/data
//
// this script parse the model data. To run: node face-data-generator.js
import fs from 'fs';
import { execSync } from 'child_process';

console.log('Generating face data...');

const model = fs.readFileSync('./canonical-face-model.obj', 'utf8');
const modelEOL = '\n';
const modelLines = model.split(modelEOL);

const positions: number[][] = [];
const uvs: number[][] = [];
const faces: number[] = [];
const uvIndexes: number[] = [];

modelLines.forEach((line) => {
  const ss = line.split(' ');

  if (ss[0] === 'f') {
    for (let i = 1; i <= 3; i++) {
      const [index, uvIndex] = ss[i].split('/');

      uvIndexes[parseInt(uvIndex) - 1] = parseInt(index) - 1;
    }
  }
});

let uvCount = 0;

modelLines.forEach((line) => {
  const ss = line.split(' ');

  if (ss[0] === 'v') {
    positions.push([parseFloat(ss[1]), parseFloat(ss[2]), parseFloat(ss[3])]);
  } else if (ss[0] === 'vt') {
    uvs[uvIndexes[uvCount++]] = [parseFloat(ss[1]), parseFloat(ss[2])];
  } else if (ss[0] === 'f') {
    faces.push(
      parseInt(ss[1].split('/')[0]) - 1,
      parseInt(ss[2].split('/')[0]) - 1,
      parseInt(ss[3].split('/')[0]) - 1
    );
  }
});

// important landmarks for computing transformation
// pairs of [positionIndex, weight]
const landmarkBasis = [
  [4, 0.070909939706326],
  [6, 0.032100144773722],
  [10, 0.008446550928056],
  [33, 0.058724168688059],
  [54, 0.007667080033571],
  [67, 0.009078059345484],
  [117, 0.009791937656701],
  [119, 0.014565368182957],
  [121, 0.018591361120343],
  [127, 0.005197994410992],
  [129, 0.120625205338001],
  [132, 0.005560018587857],
  [133, 0.05328618362546],
  [136, 0.066890455782413],
  [143, 0.014816547743976],
  [147, 0.014262833632529],
  [198, 0.025462191551924],
  [205, 0.047252278774977],
  [263, 0.058724168688059],
  [284, 0.007667080033571],
  [297, 0.009078059345484],
  [346, 0.009791937656701],
  [348, 0.014565368182957],
  [350, 0.018591361120343],
  [356, 0.005197994410992],
  [358, 0.120625205338001],
  [361, 0.005560018587857],
  [362, 0.05328618362546],
  [365, 0.066890455782413],
  [372, 0.014816547743976],
  [376, 0.014262833632529],
  [420, 0.025462191551924],
  [425, 0.047252278774977],
];

const doubleEnter = `${modelEOL}${modelEOL}`;
const fileHeader = `//This is a generated file${doubleEnter}`;

let faceOutput = '';
faceOutput += fileHeader;
faceOutput += 'const faces =' + JSON.stringify(faces) + `;${doubleEnter}`;

let landmarkBasisOutput = '';
landmarkBasisOutput += fileHeader;
landmarkBasisOutput += 'const landmarkBasis =' + JSON.stringify(landmarkBasis) + `;${doubleEnter}`;

let positionsOutput = '';
positionsOutput += fileHeader;
positionsOutput += 'const positions =' + JSON.stringify(positions) + `;${doubleEnter}`;

let uvsOutput = '';
uvsOutput += fileHeader;
uvsOutput += 'const uvs =' + JSON.stringify(uvs) + `;${doubleEnter}`;

faceOutput += 'export default faces;';
landmarkBasisOutput += 'export default landmarkBasis;';
uvsOutput += 'export default uvs;';
positionsOutput += 'export default positions;';

let outputIndex = '';
outputIndex += fileHeader;
outputIndex += `
import faces from './faces';
import landmarkBasis from './landmark-basis';
import positions from './positions';
import uvs from './uvs';

export { faces, landmarkBasis, positions, uvs };`;

const isFileExist = fs.existsSync('./face-data');

// If directory exists, remove it.
if (isFileExist) fs.rmSync('./face-data', { recursive: true });

// Create a new directory.
fs.mkdirSync('./face-data');

fs.writeFileSync('./face-data/faces.ts', faceOutput);
fs.writeFileSync('./face-data/landmark-basis.ts', landmarkBasisOutput);
fs.writeFileSync('./face-data/positions.ts', positionsOutput);
fs.writeFileSync('./face-data/uvs.ts', uvsOutput);
fs.writeFileSync('./face-data/index.ts', outputIndex);

execSync('npx prettier --write ./face-data/faces.ts');
execSync('npx prettier --write ./face-data/landmark-basis.ts');
execSync('npx prettier --write ./face-data/positions.ts');
execSync('npx prettier --write ./face-data/uvs.ts');
execSync('npx prettier --write ./face-data/index.ts');

console.log('Face data generated successfully...');
