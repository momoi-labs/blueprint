import StyleDictionary from 'style-dictionary';

const MODES = ['dark', 'light'];
const varName = (path) => path[0] === 'semantic' ? '--color-' + path.slice(1).join('-') : '--' + path.join('-');
const isRef = (v) => typeof v === 'string' && v.trim().startsWith('{');
const refVar = (ref) => 'var(' + varName(ref.replace(/[{}]/g, '').trim().split('.')) + ')';
const hex = (v) => (v && v.hex) || v;
function* walk(node, path = []) { for (const [key, value] of Object.entries(node)) { if (!value || typeof value !== 'object' || key.startsWith('$')) continue; if ('$value' in value) yield { path: [...path, key], token: value }; else yield* walk(value, [...path, key]); } }
const valueForMode = (token, mode) => token.$extensions?.mode?.[mode] || token.$value;
const block = (selector, entries) => selector + ' {\n' + entries.map(([n, v]) => `  ${n}: ${v};`).join('\n') + '\n}';
StyleDictionary.registerFormat({ name: 'css/kiso-themes', format: ({ dictionary }) => { const tokens = [...walk(dictionary.tokens)]; const rendered = {}; for (const mode of MODES) rendered[mode] = tokens.map(({ path, token }) => { const value = valueForMode(token, mode); return [varName(path), isRef(value) ? refVar(value) : hex(value)]; }); const dark = new Map(rendered.dark); const lightDelta = rendered.light.filter(([n, v]) => dark.get(n) !== v); return ['/* Kiso colour tokens — generated from tokens/tokens.json. Do not edit. */', block(':root', rendered.dark), block('[data-theme="light"]', lightDelta), ''].join('\n\n'); } });
export default { source: ['tokens/tokens.json'], platforms: { css: { transforms: ['attribute/cti', 'name/kebab'], buildPath: 'tokens/build/', files: [{ destination: 'tokens.css', format: 'css/kiso-themes' }] } } };
