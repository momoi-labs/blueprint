# @momoi-labs/kiso

## 0.2.0

### Minor Changes

- e88497a: Kiso v1.1: control-height tokens, a filled primary, and ramp extremes.

  Brand colours are unchanged — every hex is identical to v1. The violet's
  _role_ changes: it is now the solid fill of the primary action, with the new
  `--color-primary-foreground` on top.

  **Breaking for consumers of the generated CSS:**

  - `tokens.css` no longer puts values under `[data-theme="light"]`. Every
    custom property is declared once in `:root` using `light-dark()`, and the
    theme is selected by `color-scheme`. Omitting `data-theme` now means "follow
    the OS" rather than "dark".
  - The type scale moves to 11/12/14/16/18/22/30; body is 14px, not 16px.
  - Radii shrink: `--radius-sm` 4→3, `--radius-md` 8→4, `--radius-lg` 12→5.
    New `--radius-xs` (2px) and `--radius-surface` (0px). Panels are square and
    carry corner marks instead of a radius.

  **Added:** `size.control.*` (24/32/36/40) separate from `size.touch.min` (44,
  for coarse pointers only); `size.icon.*`, `size.sidebar`, `size.content.max`;
  `corner.*` and `hatch.*`; `--shadow-xs` and `--shadow-lg`, with shadow colour
  as a token; `neutral.50/950` and `accent.50/500/950`; `spacing.2xs`;
  `type.line-height.snug`; `type.letter-spacing.display` and `.caps`; and the
  semantic roles the component layer needs — fills and their foregrounds,
  component surfaces, lines, tints, and status fills.
