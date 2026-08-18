import StyleDictionary from 'style-dictionary';

const MODES = ['dark', 'light'];
const varName = (path) => path[0] === 'semantic' ? '--color-' + path.slice(1).join('-') : '--' + path.join('-');
const isRef = (v) => typeof v === 'string' && v.trim().startsWith('{');
const refVar = (ref) => 'var(' + varName(ref.replace(/[{}]/g, '').trim().split('.')) + ')';
const cssValue = (v) => {
  if (typeof v === 'string' || typeof v === 'number') return v;
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x === 'number')) return 'cubic-bezier(' + v.join(', ') + ')';
    if (v.every((x) => typeof x === 'string')) return v.join(', ');
    return v.map(cssValue).join(', ');
  }
  if (v && typeof v === 'object') {
    if (v.hex) return v.hex;
    if ('offsetX' in v) return [v.offsetX, v.offsetY, v.blur || '0px', v.spread || '0px', cssValue(v.color)].join(' ');
    return String(v);
  }
  return v;
};
function* walk(node, path = []) { for (const [key, value] of Object.entries(node)) { if (!value || typeof value !== 'object' || key.startsWith('$')) continue; if ('$value' in value) yield { path: [...path, key], token: value }; else yield* walk(value, [...path, key]); } }
const valueForMode = (token, mode) => token.$extensions?.mode?.[mode] || token.$value;
const block = (selector, entries) => selector + ' {\n' + entries.map(([n, v]) => '  ' + n + ': ' + v + ';').join('\n') + '\n}';
StyleDictionary.registerFormat({
  name: 'css/kiso-themes',
  format: ({ dictionary }) => {
    const tokens = [...walk(dictionary.tokens)];
    // token.original holds the pre-resolution values, so alias references
    // survive Style Dictionary's parse-time resolution and are emitted as
    // var() indirections — required for mode-aware primitives (e.g. light
    // accent.base flowing into --color-primary via var(--color-accent-base)).
    // Typography composites (type.role.*) are expanded into one custom
    // property per sub-property so consumers get --type-role-<role>-font-size
    // etc. from a single DTCG typography token.
    const TYPO_PROPS = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'font-variant-numeric'];
    const expanded = [];
    for (const { path, token } of tokens) {
      const src = token.original || token;
      if (src.$type === 'typography' && src.$value && typeof src.$value === 'object') {
        for (const prop of TYPO_PROPS) {
          if (prop in src.$value) expanded.push({ path: [...path, prop], resolve: () => src.$value[prop] });
        }
      } else {
        expanded.push({ path, resolve: (mode) => valueForMode(src, mode) });
      }
    }
    const rendered = {};
    for (const mode of MODES) rendered[mode] = expanded.map(({ path, resolve }) => {
      const value = resolve(mode);
      return [varName(path), isRef(value) ? refVar(value) : cssValue(value)];
    });
    const dark = new Map(rendered.dark);
    const lightDelta = rendered.light.filter(([n, v]) => dark.get(n) !== v);
    const reducedMotion = tokens
      .filter(({ path }) => path[0] === 'motion' && path[1] === 'duration')
      .map(({ path }) => [varName(path), '0s']);
    const out = [
      '/* Kiso design tokens — generated from tokens/tokens.json. Do not edit. */',
      block(':root', rendered.dark),
      block('[data-theme="light"]', lightDelta)
    ];
    if (reducedMotion.length) {
      const mediaBody = block(':root', reducedMotion).split('\n').map((l) => '  ' + l).join('\n');
      out.push('@media (prefers-reduced-motion: reduce) {\n' + mediaBody + '\n}');
    }
    out.push('');
    return out.join('\n\n');
  }
});
export default { source: ['tokens/tokens.json'], platforms: { css: { transforms: ['attribute/cti', 'name/kebab'], buildPath: 'tokens/build/', files: [{ destination: 'tokens.css', format: 'css/kiso-themes' }] } } };
