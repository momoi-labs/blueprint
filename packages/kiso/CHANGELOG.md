# @momoi-labs/kiso

## 0.15.0

### Minor Changes

- e372c90: Add table density, header treatment and an optional frameless wrapper.
  
  Add an optional rail appearance to Alert and use the contracted body
  typography for descriptions.
  
  Allow ApplicationShell to place its sidebar toggle in the header while
  preserving expanded state, labels and focus recovery.
  Add AppShellPanel for an optional end panel. Hidden navigation and panel
  columns release their space independently. ApplicationShell accepts a panel
  slot in both layouts.
  Keep the inset main frame and its corner marks above both adjacent rails.
  AppShellPanelToggle can stay in the header or float beside the panel edge.
  Floating placement reserves space so the toggle does not cover main content
  or its scrollbar.
  
  Add inline FormField labels, decorative icons and described unit suffixes.
  Input, SelectTrigger and FormField now share optional controlSize settings.
  
  Add solid and frameless border styles with independent corner shapes.
  Use `data-corner-style="rounded"` with a separate size to choose roundness.
  Preserve legacy border values and keep control borders and focus visible in
  frameless regions.
  
  Keep long inline Select values clear of the chevron and allow selected column
  styles to override the plain table header.
- 74d3267: Add canvas backgrounds, Pixel, Manga and Brush frames, and independent outer
  and inner appearance scopes. Include accent paper, drawing guides, pattern
  placement and translucent panels for the drawing-sheet compositions.
  
  Extend expressive fills, footers and shell headers to their painted contours.
  Keep native select options readable and retain their arrows with Pixel frames
  and control marks.

## 0.14.0

### Minor Changes

- 1274be4: Add optional sidebar collapse with keyboard controls, accessible navigation,
  controlled state, and support for existing appearance settings.

  Add editorial PageHeader and inset AppShell variants. The inset frame follows
  Appearance settings, and existing layouts remain the default. Support global
  visual style and frame preferences, with component variants taking precedence.
  Editorial now shares presentation tokens across page and section titles,
  cards, metrics, and layout spacing while retaining control and table density.
  Regions can opt into the default style independently.

  Keep the desktop inset frame and its header visible while page content scrolls
  inside it, preserving the top border, gutter, and corner marks.

  Add a cards variant to ThemeSelector with labeled system, light, and dark
  previews. Preserve the compact default and the same radio keyboard controls.

## 0.13.0

### Minor Changes

- dc26213: Add FilterInput with continuous typing, editable filter segments, IN lists,
  and nested logical groups while preserving ChipInput.
- cd5356e: `.form-page` fills the viewport from 1024px the way `.detail-tabs` does: the
  card takes the height the header leaves and the form scrolls inside it under
  sticky FormActions. Both cards accept `data-fill="false"` to let the document
  scroll instead, the opt-out a list's `.table-wrap` already had.
- 06e2899: Add Lifecycle and StatusBadge, and the list, detail and create screen classes:
  `.list-filters`, `.lifecycle` with its `.cluster-status` and `.cluster-verbs`,
  `.detail-tabs` with `.detail-logs` and `.detail-pane`, and `.form-page`.
  From 1024px a detail card, and a list's `.table-wrap` that is the last child
  of `.page`, fill the viewport; set `data-fill="false"` on the `.table-wrap` to
  keep a list at its natural height.
  Products that copied them from self-host (ADR-0024) can delete their copies;
  rename `.detail-terminal` to `.detail-pane`. Evidence is in issue #112.

### Patch Changes

- b63f071: Fix overlapping checkbox targets and give switches, tabs, and time range triggers 44px touch targets without changing desktop sizing.
- df5391b: Give editable chip segments 44px touch targets while preserving compact mouse controls.
- 7cc19f1: Wrap long Meter, Progress, and BarGauge labels inside their panels while
  keeping values visible.
- 0cbb61c: Keep `.btn-group` buttons joined under every border style. The appearance
  rule that rounds each control came later with the same specificity, so the
  buttons kept their own corners and the group read as loose buttons.
- ccfecb8: Raise LogView timestamp contrast on its fixed dark surface.
- 19b8dbd: Use the normal-text foreground role for small labels, placeholders, and chip
  syntax, and clarify the subtle role's contrast limits.
- 9edbbcc: Keep structured chips within narrow forms and scroll long segments without shrinking their controls.
- 4c8ea69: Fix clipped Lifecycle actions on touch devices by letting the group grow around its 44px buttons and borders.
- 49159e3: Give pagination controls 44px touch targets and wrap narrow rows.

  Give Splitter a 44px touch target with reserved space beside adjacent controls.

  Use the selected foreground color for ChipInput suggestion descriptions so they
  meet text contrast requirements in both themes.

- e25cba8: Preserve adjacent filter conditions during autocomplete and announce repeated
  changes. Fix selected suggestion description contrast.
- 2fc2e12: Add space between dialog headers and footers when the body is omitted.

## 0.12.1

### Patch Changes

- 50a2c5c: Let `.page` and `.stack` shrink below their content width so a wide table, chart, or log line scrolls in place instead of widening the page.
- eeecd99: Keep hidden corner marks and the selected tab's underline inside their boxes.
  Marks turned off with `--corner-mark: 0` or `data-corner-marks="none"` no longer
  reach outside the frame, and the tab underline no longer ends one pixel past the
  button, so a scroll container around a panel or a sideways-scrolling tab strip
  stops showing scrollbars for pixels nobody sees.
- 66e3486: Stack the sidebar above main on narrow viewports instead of hiding it.
- 39d227f: Keep tab labels on one line in a strip that scrolls sideways.
- 87fb58c: Size a select in `.table-toolbar` to its content instead of the full row.

## 0.12.0

### Minor Changes

- 010f82c: Include the gallery's border, corner, and mark settings in the package stylesheet
  so copied appearance attributes work without gallery files. Keep default styles,
  create decorative overlays only when needed, and apply reduced motion settings
  outside the gallery.

## 0.11.0

### Minor Changes

- 8709e57: Add accent themes. `tokens/tokens.json` gains the `terracotta`, `teal`, and
  `cobalt` primitive ramps beside the renamed `violet` ramp, and an `accent.*`
  group that the build emits as one `[data-accent="<name>"]` block each. A block
  remaps the active `--color-accent-*` ramp and restates the dark fills; the
  neutrals stay the same under every hue accent. `nocturne` is the marketing
  site's cool slate palette under the violet ink and is the one accent that
  restates the neutral roles; theme and accent compose
  through `light-dark()`. `chart-1` is pinned to the violet ink so chart series
  stay apart from the status series under every accent. The contrast and chart
  palette gates now run once per accent. New contract:
  `docs/components/accent-selector.md`.
- adee404: Add StepList and StepBar for a run a machine walks and a person reads. StepList
  is one row per step with a state, a label, and a timing on a rail that fills as
  the run advances; put it in a Split with the selected step's LogView beside
  it. StepBar is the same run as one segment per step, for a summary tab, a
  table cell, or a toast. Evidence and decisions are in issue #98.
- 0f3f06c: Add Form and FormActions with optional status messages and sticky actions
  for page and panel scrolling.

### Patch Changes

- 34005f7: Make DashboardPanel content fill the row. Panels in one grid row already
  shared a height, but the Card inside kept its content height, so a short
  Stat or Meter ended above its neighbour with bare background below. The panel
  is now a grid, so its child stretches to the row.
- 65bb111: Fix StatDelta variants rendering as neutral. `.badge-outline` came later in
  the cascade than the bare `.success`/`.warning`/`.danger`/`.info` colour
  classes, so every delta showed muted text. The variant now colours the text and
  frame while keeping the outline treatment the spec describes.

## 0.10.0

### Minor Changes

- 569f8ea: Add metrics dashboard components for collected time series: framed charts,
  summary legends, meters, progress tracks, bar gauges, disclosure, time range
  controls, and a responsive panel grid. Publish five categorical chart roles
  with contrast checks and support missing samples in Sparkline.

  Add standard, compact, and split chart layouts; inline, table, and sidebar
  legends; and controlled or local series highlighting. Use continuous strokes,
  keep split scales shared, and synchronize sidebar inspection by timestamp.

  Use a compact time-range preset menu with a separate custom form and thin
  meter and progress tracks with labels above.

## 0.9.0

### Minor Changes

- 8da2ca0: ApplicationShell `layout="topbar"` for single-surface chrome without a sidebar

  Single-page products need the shared shell API with brand and primary action in
  the top bar, not a permanent rail. Topbar mode omits Sidebar, rejects
  navigation/footer at the type level, and uses `.app-shell[data-layout="topbar"]`
  for one main column at every width. Default remains sidebar.

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
