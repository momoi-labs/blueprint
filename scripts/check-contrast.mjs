#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const tokensPath = process.argv[2] ?? 'tokens/tokens.json';
const backgrounds = ['background', 'surface', 'elevated-surface'];
const textRoles = new Map([
  ['foreground', 4.5],
  ['muted-foreground', 4.5],
  ['primary', 4.5],
  ['accent', 4.5],
  ['success', 4.5],
  ['warning', 4.5],
  ['danger', 4.5],
  ['info', 4.5],
  ['subtle-foreground', 3],
]);

// Roles that draw a line or a boundary rather than text: WCAG 1.4.11.
const nonTextRoles = new Map([
  ['border-strong', 3],
  ['corner-mark', 3],
]);

// A foreground role painted on top of a filled role, not on a surface. This is
// the pair that a system without a *-foreground slot gets wrong: the fill is
// applied, the text keeps the page foreground, and the control turns into an
// outline. Each pair is checked in both themes.
const fillPairs = [
  ['primary-foreground', 'primary', 4.5],
  ['danger-foreground', 'danger', 4.5],
  ['secondary-foreground', 'secondary', 4.5],
  ['selected-foreground', 'selected', 4.5],
  ['card-foreground', 'card', 4.5],
  ['popover-foreground', 'popover', 4.5],
];

function tokenAt(tokens, path) {
  const token = path.split('.').reduce((node, segment) => node?.[segment], tokens);
  if (!token || typeof token !== 'object' || !('$value' in token)) {
    throw new Error(`missing token {${path}}`);
  }
  return token;
}

function resolveToken(tokens, path, theme, chain = []) {
  if (chain.includes(path)) {
    throw new Error(`circular token reference: ${[...chain, path].join(' -> ')}`);
  }

  const token = tokenAt(tokens, path);
  const value = token.$extensions?.mode?.[theme] ?? token.$value;
  if (typeof value === 'string') {
    const reference = value.match(/^\{([^{}]+)\}$/);
    if (reference) return resolveToken(tokens, reference[1], theme, [...chain, path]);
    if (/^#[\da-f]{3}([\da-f]{3})?$/i.test(value)) return value;
  }
  if (value && typeof value === 'object' && /^#[\da-f]{3}([\da-f]{3})?$/i.test(value.hex)) {
    return value.hex;
  }

  throw new Error(`unsupported color value for {${path}} in theme=${theme}`);
}

function rgb(hex) {
  const digits = hex.slice(1);
  const expanded = digits.length === 3
    ? [...digits].map((digit) => digit + digit).join('')
    : digits;
  return [0, 2, 4].map((offset) => Number.parseInt(expanded.slice(offset, offset + 2), 16) / 255);
}

function luminance(hex) {
  const channels = rgb(hex).map((channel) => (
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function roleColor(tokens, role, theme) {
  return resolveToken(tokens, `semantic.${role}`, theme);
}

async function main() {
  const tokens = JSON.parse(await readFile(tokensPath, 'utf8'));
  const failures = [];

  for (const theme of ['dark', 'light']) {
    for (const [role, minimum] of textRoles) {
      for (const background of backgrounds) {
        const ratio = contrast(
          roleColor(tokens, role, theme),
          roleColor(tokens, background, theme),
        );
        if (ratio < minimum) {
          failures.push(
            `role=${role} theme=${theme} bg=${background} ratio=${ratio.toFixed(2)}:1 (need ${minimum}:1)`,
          );
        }
      }
    }

    for (const [role, minimum] of nonTextRoles) {
      for (const background of backgrounds) {
        const ratio = contrast(
          roleColor(tokens, role, theme),
          roleColor(tokens, background, theme),
        );
        if (ratio < minimum) {
          failures.push(
            `role=${role} theme=${theme} bg=${background} ratio=${ratio.toFixed(2)}:1 (need ${minimum}:1)`,
          );
        }
      }
    }

    for (const [role, fill, minimum] of fillPairs) {
      const ratio = contrast(roleColor(tokens, role, theme), roleColor(tokens, fill, theme));
      if (ratio < minimum) {
        failures.push(
          `role=${role} theme=${theme} on=${fill} ratio=${ratio.toFixed(2)}:1 (need ${minimum}:1)`,
        );
      }
    }

    const focusRatio = contrast(
      roleColor(tokens, 'focus', theme),
      roleColor(tokens, 'background', theme),
    );
    if (focusRatio < 3) {
      failures.push(
        `role=focus theme=${theme} bg=background ratio=${focusRatio.toFixed(2)}:1 (need 3:1)`,
      );
    }
  }

  if (failures.length > 0) {
    console.error(`AA contrast check failed (${failures.length} combinations):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `AA contrast check passed: ${textRoles.size * backgrounds.length * 2} text, `
    + `${nonTextRoles.size * backgrounds.length * 2} non-text, ${fillPairs.length * 2} on-fill `
    + 'and 2 focus combinations across dark and light themes.',
  );
}

main().catch((error) => {
  console.error(`AA contrast check could not run: ${error.message}`);
  process.exitCode = 1;
});
