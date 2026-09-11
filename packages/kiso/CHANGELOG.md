# @momoi-labs/kiso

## 0.8.0

### Minor Changes

- 7421123: add ChipInput for multi-value fields with per-value options

  A field that collects several structured values, each rendered as a chip that
  reads like a call: scope, name, value, then one segment per option as
  `name=value` or `name=[a, b]`. The value and the options edit in place.

- b0e9f03: add Sparkline for single-series metric trends

  The self-host console needed the shape of one metric at cell size three
  times over, which is the evidence the v1 chart deferral asked for. The
  component draws one series with Recharts using tokens only: neutral by
  default, tone="primary" for the series a tile is about, nothing drawn below
  two samples. The ui.css chart area becomes a flat token fill, removing the
  document-level gradient id no component defined.

- 87775cb: dedicated warm dark ramp ("Sumi") and accent ink/fill split

  The dark theme no longer borrows the cold, purple-leaning tail of the light
  neutral ramp. It draws surfaces from a dedicated `color.dark.50-950` ramp in
  the light ramp's warm hue, with enough layer spacing for the sidebar to sink
  below the canvas and cards to lift above it.

  The accent splits into two roles: a text-eligible light ink
  (`--color-accent-base`, consumed by `--color-link` and `--color-focus`) and a
  deep violet fill (`--color-primary` and its hover and surface tints) that
  keeps near-white text. Status dark steps and their tint/border alphas are
  recalibrated, and `--color-primary` is no longer text-eligible on dark, so
  ink-level affordances (links, focus rings, the nav rail) draw with the ink
  instead.

  No custom property is removed or renamed, so existing consumers keep working;
  the new `--color-dark-*` steps are additive.

## 0.7.1

### Patch Changes

- fb71070: Stop Google Fonts from breaking CSS compilation when styles are flattened.

  `ui.css` no longer `@import`s fonts. Nested after `tokens.css`, that import
  landed mid-sheet in Next.js and failed the `@import` must precede all rules
  rule. `@momoi-labs/kiso-react/styles.css` now leads with the fonts `@import`.
  Consumers of `ui.css` alone load Inter and JetBrains Mono themselves.

## 0.7.0

### Minor Changes

- fc586b2: Add the React compositions that the self-host console had to own locally.
  FormField now accepts any control and wires its help and validation. Toasts and
  useToast manage notifications raised below the provider. ApplicationShell
  builds the shared frame from product-owned destinations and slots.

## 0.6.0

### Minor Changes

- d716077: Mark the current navigation destination beside the item instead of on it.

  `--color-selected` and `--color-accent-surface-hover` are the same value, so a
  filled current item and a hovered sibling painted the same surface and the 2px
  rail was left carrying the whole distinction. The fill now belongs to hover
  alone, and the marker moves into the sidebar's gutter, where it finally has the
  shared edge a rail needs.

  `.nav-row` lays navigation out in a row and moves that marker to the bottom
  edge, so a horizontal nav stops wearing a sidebar's left rail.

  The React layer stopped forcing a column on every navigation list, so the row
  treatment is not overridden from the package that consumes it.

- 4b6b6bc: Give `--color-selected` a value of its own, one ramp step past
  `--color-accent-surface-hover` (`accent.300` light, `accent.800` dark).

  The two tokens held the same value in both themes, so anything that can be
  hovered and selected at once painted one surface for both. In the command
  palette that is a defect: arrow down to the third command with the pointer over
  the first and both look highlighted, while only the keyboard one will run.

  Selection now reads as more committed than a hover, which is what a consumer
  reaching for the token expects. `selected-foreground` still clears 4.5:1 on the
  new fill in both themes.

### Patch Changes

- 266747b: Document the seven existing console layout components and add them to the
  component catalog, including pane resizing and log follow-tail behavior.

## 0.5.0

### Minor Changes

- 8670908: Add BrandMark for decorative letters and SVG icons beside product names, with
  the momoi-labs TerminalIcon glyph. Document the component contract and preserve
  the existing CSS output.

## 0.4.1

### Patch Changes

- b52ff7f: Correct the shadcn variant mapping for filled Buttons

  The v1.1 tokens made `primary` and `destructive` solid fills and added the
  `--color-primary-foreground` / `--color-danger-foreground` label roles, but the
  shadcn mapping table in `button.md` still told implementers to restyle
  shadcn's `outline` into accent text on a surface — the exact treatment the
  variants table two sections above forbids. `icon-button.md` deferred to the
  same stale sentence.

  Reported downstream (#57) as a Button whose contract disagreed with itself.

## 0.4.0

### Minor Changes

- 2e67f9e: Stop `.logview` and `pre` from scrolling for their own corner marks

  The corner marks are absolutely positioned outside the frame they decorate, so
  any element that draws them and also sets `overflow` scrolls a few pixels of
  its own decoration — `.logview` showed both scrollbars while empty, and `pre`
  showed a spurious horizontal one. `.table-wrap` already answered this by
  putting the frame on one element and the scrolling on `.table-scroll` inside
  it; `.logview` and `pre` now do the same.

  **Breaking for consumers of `ui.css`:** log lines go inside a
  `<div class="log-scroll">` within `.logview`, and code goes inside `<code>`
  within `<pre>`. Height still goes on `.logview`; the scroller takes what is
  left of it.

## 0.3.0

### Minor Changes

- 8e62b50: Publish the component layer as `@momoi-labs/kiso/ui.css`

  `ui.css` moves from `kiso/blocks/` to `kiso/`, so it ships with the package
  instead of being copied out of the repository with `curl`. `kiso/blocks/`
  stays unpublished and now links `../ui.css`, keeping the blocks illustrations
  of a layer rather than the source of it. Consumers can pin contracts, tokens,
  and the component layer to one version.

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
