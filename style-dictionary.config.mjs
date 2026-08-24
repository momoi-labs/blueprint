import StyleDictionary from 'style-dictionary';

// Order matters: light-dark() takes the light value first.
const MODES = ['light', 'dark'];
// Must match the $extensions key in tokens/tokens.json: { "$extensions": { "com.momoi-labs.kiso": { "fontVariantNumeric": ... } } }.
const NAMESPACE = 'com.momoi-labs.kiso';

const varName = (path) => path[0] === 'semantic' ? '--color-' + path.slice(1).join('-') : '--' + path.join('-');
const isRef = (v) => typeof v === 'string' && v.trim().startsWith('{');
const refVar = (ref) => 'var(' + varName(ref.replace(/[{}]/g, '').trim().split('.')) + ')';
const fail = (msg) => { throw new Error(msg); };

const colorCss = (c) => {
  if (!c || typeof c !== 'object') return fail('color must be an object, got ' + JSON.stringify(c));
  if (c.hex && (c.alpha === undefined || c.alpha === 1)) return c.hex;
  if (c.colorSpace === 'srgb' && Array.isArray(c.components) && c.components.length === 3) {
    const [r, g, b] = c.components.map((n) => Math.round(n * 255));
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + (c.alpha ?? 1) + ')';
  }
  return fail('unsupported color value: ' + JSON.stringify(c));
};

const unitValueCss = (v) => {
  if (!v || typeof v !== 'object' || typeof v.value !== 'number' || typeof v.unit !== 'string') {
    return fail('dimension/duration must be { value, unit }, got ' + JSON.stringify(v));
  }
  return String(v.value) + v.unit;
};

const fontFamilyCss = (v) => (Array.isArray(v) ? v.join(', ') : String(v));

const cubicBezierCss = (v) => {
  if (!Array.isArray(v) || v.length !== 4 || !v.every((n) => typeof n === 'number')) {
    return fail('cubicBezier must be an array of 4 numbers, got ' + JSON.stringify(v));
  }
  return 'cubic-bezier(' + v.join(', ') + ')';
};

const shadowCss = (v) => {
  if (!v || typeof v !== 'object') return fail('shadow must be an object, got ' + JSON.stringify(v));
  // The shadow colour is a token in its own right (color.shadow.*), so it
  // arrives here as an alias and must stay a var() indirection.
  const color = isRef(v.color) ? refVar(v.color) : colorCss(v.color);
  return ['offsetX', 'offsetY', 'blur', 'spread'].map((k) => unitValueCss(v[k])).concat(color).join(' ');
};

// Serialize a value by its DTCG $type (not by JavaScript shape heuristics).
const render = (value, type) => {
  if (isRef(value)) return refVar(value);
  switch (type) {
    case 'color': return colorCss(value);
    case 'dimension':
    case 'duration': return unitValueCss(value);
    case 'fontFamily': return fontFamilyCss(value);
    case 'fontWeight':
    case 'number': return value;
    case 'cubicBezier': return cubicBezierCss(value);
    case 'shadow': return shadowCss(value);
    default: return fail('unsupported $type ' + type);
  }
};

// DTCG's $type enum has no angle, so hatch.angle is a number whose CSS unit
// rides in the namespaced extension. Without this the SCSS and TypeScript
// artifacts ship a bare `45` where a gradient needs `45deg`.
StyleDictionary.registerTransform({
  name: 'kiso/unit-extension',
  type: 'value',
  transitive: true,
  filter: (token) => Boolean(token.$extensions?.[NAMESPACE]?.unit),
  transform: (token) => String(token.$value) + token.$extensions[NAMESPACE].unit
});

StyleDictionary.registerTransform({
  name: 'kiso/duration-css',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'duration',
  transform: (token) => unitValueCss(token.$value)
});

function* walk(node, path = []) { for (const [key, value] of Object.entries(node)) { if (!value || typeof value !== 'object' || key.startsWith('$')) continue; if ('$value' in value) yield { path: [...path, key], token: value }; else yield* walk(value, [...path, key]); } }

const valueForMode = (token, mode) => token.$extensions?.mode?.[mode] ?? token.$value;
const block = (selector, entries) => selector + ' {\n' + entries.map(([n, v]) => '  ' + n + ': ' + v + ';').join('\n') + '\n}';

// [DTCG member, CSS custom-property suffix] pairs for typography composites.
const TYPOGRAPHY_MEMBERS = [
  ['fontFamily', 'font-family'],
  ['fontSize', 'font-size'],
  ['fontWeight', 'font-weight'],
  ['letterSpacing', 'letter-spacing'],
  ['lineHeight', 'line-height']
];
const TYPOGRAPHY_TYPES = { fontFamily: 'fontFamily', fontSize: 'dimension', fontWeight: 'fontWeight', letterSpacing: 'dimension', lineHeight: 'number' };

StyleDictionary.registerFormat({
  name: 'css/kiso-themes',
  format: ({ dictionary }) => {
    const tokens = [...walk(dictionary.tokens)];

    // token.original holds the pre-resolution values, so alias references
    // survive Style Dictionary's parse-time resolution and are emitted as
    // var() indirections — required for mode-aware primitives (e.g. light
    // accent.base flowing into --color-primary via var(--color-accent-base)).
    // Typography composites (type.role.*) expand to one custom property per
    // DTCG sub-property.
    const expanded = [];
    let globalFontVariantNumeric;
    for (const { path, token } of tokens) {
      const src = token.original || token;
      const type = token.$type || src.$type;
      if (type === 'typography') {
        for (const [member, suffix] of TYPOGRAPHY_MEMBERS) {
          expanded.push({ path: [...path, suffix], value: (mode) => render(src.$value[member], TYPOGRAPHY_TYPES[member]) });
        }
        const fontVariantNumeric = src.$extensions?.[NAMESPACE]?.fontVariantNumeric;
        if (fontVariantNumeric) globalFontVariantNumeric = globalFontVariantNumeric ?? fontVariantNumeric;
      } else {
        // DTCG has no angle type, so hatch.angle is a number carrying its CSS
        // unit in the namespaced extension.
        const unit = src.$extensions?.[NAMESPACE]?.unit ?? '';
        expanded.push({ path, value: (mode) => render(valueForMode(src, mode), type) + unit });
      }
    }

    // font-variant-numeric has no DTCG string token type and is not a
    // typography member, so it lives as a namespaced extension on the role
    // that uses it (type.role.numeric) and is emitted as the single global
    // --font-variant-numeric feature token.
    if (globalFontVariantNumeric) expanded.push({ path: ['font', 'variant-numeric'], value: (mode) => globalFontVariantNumeric });

    // Every custom property is declared exactly once. A token whose two modes
    // differ is emitted as CSS light-dark(), which resolves against the
    // inherited color-scheme — so "follow the OS" needs no media query and no
    // JS, and an explicit choice only has to flip color-scheme.
    const rendered = expanded.map(({ path, value }) => {
      const [light, dark] = MODES.map((mode) => value(mode));
      return [varName(path), light === dark ? dark : 'light-dark(' + light + ', ' + dark + ')'];
    });

    const reducedMotion = tokens
      .filter(({ path }) => path[0] === 'motion' && path[1] === 'duration')
      .map(({ path }) => [varName(path), '0s']);

    const out = [
      '/* Kiso design tokens — generated from tokens/tokens.json. Do not edit. */',
      block(':root', [['color-scheme', 'light dark'], ...rendered]),
      block('[data-theme="light"]', [['color-scheme', 'light']]),
      block('[data-theme="dark"]', [['color-scheme', 'dark']])
    ];
    if (reducedMotion.length) {
      const mediaBody = block(':root', reducedMotion).split('\n').map((l) => '  ' + l).join('\n');
      out.push('@media (prefers-reduced-motion: reduce) {\n' + mediaBody + '\n}');
    }
    return out.join('\n\n') + '\n';
  }
});

const buildPath = 'tokens/build/';
const webValueTransforms = [
  'attribute/cti',
  'kiso/duration-css',
  'kiso/unit-extension',
  'size/rem',
  'color/css',
  'fontFamily/css',
  'cubicBezier/css',
  'typography/css/shorthand',
  'shadow/css/shorthand'
];

export default {
  source: ['tokens/tokens.json'],
  platforms: {
    css: {
      transforms: ['attribute/cti', 'name/kebab'],
      buildPath,
      files: [{ destination: 'tokens.css', format: 'css/kiso-themes' }]
    },
    json: {
      transforms: ['name/kebab'],
      buildPath,
      files: [{ destination: 'tokens.json', format: 'json/flat' }]
    },
    typescript: {
      transforms: ['name/camel', ...webValueTransforms],
      buildPath,
      files: [{ destination: 'tokens.d.ts', format: 'typescript/es6-declarations' }]
    },
    scss: {
      transforms: ['name/kebab', ...webValueTransforms],
      buildPath,
      files: [{ destination: 'tokens.scss', format: 'scss/variables' }]
    }
  }
};
