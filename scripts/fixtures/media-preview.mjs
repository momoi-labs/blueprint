import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AudioPreview, DetailOption, DetailSelect, ImagePreview, isPlayPreviewKey, toggleAudioPreview } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
Object.assign(document.documentElement.dataset, { theme: 'dark', accent: 'violet' });
// Playback is recorded instead of heard, so the checks do not depend on audio output.
window.audios = [];
HTMLMediaElement.prototype.play = function () {
  if (!window.audios.includes(this)) window.audios.push(this);
  this.dataset.playing = 'true';
  return Promise.resolve();
};
HTMLMediaElement.prototype.pause = function () { this.dataset.playing = 'false'; };
// Silent WAV files of different lengths, so each voice has its own source
// and nothing fails to load.
const wav = samples => {
  const bytes = new Uint8Array(44 + samples).fill(128), view = new DataView(bytes.buffer);
  [...'RIFF'].forEach((c, i) => bytes[i] = c.charCodeAt(0)); view.setUint32(4, 36 + samples, true);
  [...'WAVEfmt '].forEach((c, i) => bytes[8 + i] = c.charCodeAt(0));
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true); view.setUint32(28, 8000, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  [...'data'].forEach((c, i) => bytes[36 + i] = c.charCodeAt(0)); view.setUint32(40, samples, true);
  return `data:audio/wav;base64,${btoa(String.fromCharCode(...bytes))}`;
};
window.sources = {};
const source = (name, index) => { const src = wav(800 + index); window.sources[src] = name; return src; };
const pixel = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect width="4" height="3" fill="teal"/></svg>');
const voices = ['Aiko', 'Ren', 'Sora'].map((name, index) => ({ value: name.toLowerCase(), label: name,
  description: h('p', null, `${name} reads the script.`),
  illustration: h(AudioPreview, { src: source(`${name.toLowerCase()}.wav`, index), label: name }) }));
voices.push({ value: 'mute', label: 'Mute', description: h('p', null, 'No sound.'), illustration: h(ImagePreview, { src: pixel, alt: '' }) });
const items = [{ name: 'dawn', image: pixel }, { name: 'ren', audio: source('ren-item.wav', 9) }];
function Fixture() {
  const [value, setValue] = useState('aiko');
  const [changes, setChanges] = useState(0);
  const [active, setActive] = useState(0);
  return h('main', { className: 'stack', style: { maxWidth: 800 } },
    h(DetailSelect, { label: 'Voice', value, options: voices, onValueChange: next => { setValue(next); setChanges(n => n + 1); } }),
    h('output', { 'aria-label': 'Selected' }, value), h('output', { 'aria-label': 'Changes' }, changes),
    h('div', { role: 'listbox', tabIndex: 0, 'aria-label': 'Library', 'aria-activedescendant': `item-${active}`, style: { width: 240 },
      onKeyDown: event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); setActive((active + 1) % items.length); }
        else if (isPlayPreviewKey(event)) { event.preventDefault(); toggleAudioPreview(document.getElementById(`item-${active}`)); }
      } },
      items.map((item, index) => h(DetailOption, { key: item.name, id: `item-${index}`, role: 'option', size: 'sm',
        'aria-selected': index === active, label: item.name, description: item.audio ? 'Voice' : undefined,
        illustration: item.image ? h(ImagePreview, { src: item.image, alt: '' }) : h(AudioPreview, { src: item.audio, label: item.name, tabIndex: -1 }) }))),
    h(DetailOption, { label: 'Plain', 'data-testid': 'plain' }));
}
createRoot(document.getElementById('root')).render(h(Fixture));
