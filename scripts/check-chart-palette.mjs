import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const tokens = JSON.parse(await readFile('tokens/tokens.json', 'utf8'));
function color(path, theme) {
  const token = path.split('.').reduce((node, key) => node[key], tokens);
  const value = token.$extensions?.mode?.[theme] ?? token.$value;
  if (typeof value === 'string') return color(value.slice(1, -1), theme);
  return [1, 3, 5].map(offset => parseInt(value.hex.slice(offset, offset + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
}
const multiply = (matrix, vector) => matrix.map(row => row.reduce((sum, value, index) => sum + value * vector[index], 0));
// Machado et al., severity 1, linear RGB. Published matrices:
// https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html
const simulations = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
};
// Public-domain linear sRGB conversion: https://bottosson.github.io/posts/oklab/
function lab(rgb) {
  const lms = multiply([
    [0.4122214708, 0.5363325363, 0.0514459929],
    [0.2119034982, 0.6806995451, 0.1073969566],
    [0.0883024619, 0.2817188376, 0.6299787005],
  ], rgb).map(Math.cbrt);
  return multiply([
    [0.2104542553, 0.793617785, -0.0040720468],
    [1.9779984951, -2.428592205, 0.4505937099],
    [0.0259040371, 0.7827717662, -0.808675766],
  ], lms);
}
for (const theme of ['light', 'dark']) {
  const colors = Array.from({ length: 5 }, (_, index) => color(`semantic.chart-${index + 1}`, theme));
  const band = theme === 'light' ? [0.4, 0.65] : [0.7, 0.9];
  for (const rgb of colors) {
    const [lightness, a, b] = lab(rgb);
    assert(lightness >= band[0] && lightness <= band[1], `${theme}: lightness outside chart band`);
    assert(Math.hypot(a, b) >= 0.08, `${theme}: chroma below 0.08`);
  }
  for (const [name, matrix] of Object.entries(simulations)) {
    const simulated = colors.map(rgb => lab(multiply(matrix, rgb).map(value => Math.max(0, Math.min(1, value)))));
    const distances = [];
    for (let i = 0; i < simulated.length; i++) {
      for (let j = i + 1; j < simulated.length; j++) {
        if (name !== 'normal' && j !== i + 1) continue;
        distances.push(Math.hypot(...simulated[i].map((value, axis) => value - simulated[j][axis])));
      }
    }
    const minimum = Math.min(...distances);
    // Product regression floors, not a claim that color alone is accessible.
    assert(minimum >= (name === 'normal' ? 0.1 : 0.05), `${theme} ${name}: series separation ${minimum.toFixed(3)} is too low`);
    console.log(`${theme} ${name}: minimum Oklab distance ${minimum.toFixed(3)}`);
  }
}
