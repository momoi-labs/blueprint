# @momoi-labs/kiso-react

## 0.11.1

### Patch Changes

- 6e7f47d: Fill table and form frames to their contours, retain Pixel panel bands and
  overlays, and respect control frame scopes.
- Updated dependencies [6e7f47d]
  - @momoi-labs/kiso@0.15.2

## 0.11.0

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

### Patch Changes

- 74d3267: Add canvas backgrounds, Pixel, Manga and Brush frames, and independent outer
  and inner appearance scopes. Include accent paper, drawing guides, pattern
  placement and translucent panels for the drawing-sheet compositions.
  
  Extend expressive fills, footers and shell headers to their painted contours.
  Keep native select options readable and retain their arrows with Pixel frames
  and control marks.
- Updated dependencies [e372c90]
- Updated dependencies [74d3267]
  - @momoi-labs/kiso@0.15.0

## 0.10.0

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

### Patch Changes

- Updated dependencies [1274be4]
  - @momoi-labs/kiso@0.14.0

## 0.9.0

### Minor Changes

- dc26213: Add FilterInput with continuous typing, editable filter segments, IN lists,
  and nested logical groups while preserving ChipInput.
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
- b86a06d: Stop FilterInput autocomplete from deleting malformed input. Suggestions no
  longer drop text after an unexpected character or repair malformed IN lists.
- 48f0c27: Make ThemeSelector a radio group with arrow-key selection and one tab stop.
- 19b8dbd: Use the normal-text foreground role for small labels, placeholders, and chip
  syntax, and clarify the subtle role's contrast limits.
- af116bd: EmptyState renders with the hatch, as the `.empty.hatch` block in `ui.css`
  always intended. The React component never applied the class, so empty
  regions looked like plain cards.
- e25cba8: Preserve adjacent filter conditions during autocomplete and announce repeated
  changes. Fix selected suggestion description contrast.
- 3886a67: Keep Shift+Tab navigation from accepting ChipInput suggestions.

  Ignore ChipInput and CommandPalette shortcuts during IME composition, including
  legacy composition key events and Escape dismissal.

  Restore focus after chip edits, option additions, and removals, including when a
  controlled parent replaces the edited segment.

  Constrain Select menus to the available viewport height so long option lists can
  scroll on touch screens.

  Keep Splitter drags relative to the initial pointer position so grabbing an edge
  of its touch target does not jump the pane size.

- ab919ac: Keep empty ChipInput Enter from submitting forms and let Escape dismiss suggestions without losing the query.
- Updated dependencies [b63f071]
- Updated dependencies [df5391b]
- Updated dependencies [7cc19f1]
- Updated dependencies [0cbb61c]
- Updated dependencies [ccfecb8]
- Updated dependencies [19b8dbd]
- Updated dependencies [9edbbcc]
- Updated dependencies [4c8ea69]
- Updated dependencies [dc26213]
- Updated dependencies [49159e3]
- Updated dependencies [cd5356e]
- Updated dependencies [06e2899]
- Updated dependencies [e25cba8]
- Updated dependencies [2fc2e12]
  - @momoi-labs/kiso@0.13.0

## 0.8.1

### Patch Changes

- 010f82c: Include the gallery's border, corner, and mark settings in the package stylesheet
  so copied appearance attributes work without gallery files. Keep default styles,
  create decorative overlays only when needed, and apply reduced motion settings
  outside the gallery.
- Updated dependencies [010f82c]
  - @momoi-labs/kiso@0.12.0

## 0.8.0

### Minor Changes

- 8409c6e: Add `AccentSelector`, a controlled selector for the accent, plus the `accents`
  list and `Accent` type. Named pills choose; a live preview below them shows the
  selected accent applied. The application applies `data-accent` to the document
  root the way it applies `data-theme`.
- adee404: Add StepList and StepBar for a run a machine walks and a person reads. StepList
  is one row per step with a state, a label, and a timing on a rail that fills as
  the run advances; put it in a Split with the selected step's LogView beside
  it. StepBar is the same run as one segment per step, for a summary tab, a
  table cell, or a toast. Evidence and decisions are in issue #98.
- 0f3f06c: Add Form and FormActions with optional status messages and sticky actions
  for page and panel scrolling.

### Patch Changes

- Updated dependencies [8709e57]
- Updated dependencies [34005f7]
- Updated dependencies [65bb111]
- Updated dependencies [adee404]
- Updated dependencies [0f3f06c]
  - @momoi-labs/kiso@0.11.0

## 0.7.0

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

### Patch Changes

- Updated dependencies [569f8ea]
  - @momoi-labs/kiso@0.10.0

## 0.6.1

### Patch Changes

- 4468ce8: republish ApplicationShell topbar after npm staged 0.6.0

  Trusted publishing staged @momoi-labs/kiso-react@0.6.0 with provenance but
  the registry never finalized that version (E409 on retry). Ship 0.6.1 with the
  same topbar layout so consumers can install from npm.

## 0.6.0

### Minor Changes

- 8da2ca0: ApplicationShell `layout="topbar"` for single-surface chrome without a sidebar

  Single-page products need the shared shell API with brand and primary action in
  the top bar, not a permanent rail. Topbar mode omits Sidebar, rejects
  navigation/footer at the type level, and uses `.app-shell[data-layout="topbar"]`
  for one main column at every width. Default remains sidebar.

### Patch Changes

- Updated dependencies [8da2ca0]
  - @momoi-labs/kiso@0.9.0

## 0.5.0

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

### Patch Changes

- Updated dependencies [7421123]
- Updated dependencies [b0e9f03]
- Updated dependencies [87775cb]
  - @momoi-labs/kiso@0.8.0

## 0.4.1

### Patch Changes

- fb71070: Stop Google Fonts from breaking CSS compilation when styles are flattened.

  `ui.css` no longer `@import`s fonts. Nested after `tokens.css`, that import
  landed mid-sheet in Next.js and failed the `@import` must precede all rules
  rule. `@momoi-labs/kiso-react/styles.css` now leads with the fonts `@import`.
  Consumers of `ui.css` alone load Inter and JetBrains Mono themselves.

- Updated dependencies [fb71070]
  - @momoi-labs/kiso@0.7.1

## 0.4.0

### Minor Changes

- fc586b2: Add the React compositions that the self-host console had to own locally.
  FormField now accepts any control and wires its help and validation. Toasts and
  useToast manage notifications raised below the provider. ApplicationShell
  builds the shared frame from product-owned destinations and slots.

### Patch Changes

- Updated dependencies [fc586b2]
  - @momoi-labs/kiso@0.7.0

## 0.3.0

### Minor Changes

- 0074e57: Add the console layout patterns that existed only in `ui.css`: AppShell,
  Split / Pane / Splitter, LogView, Stat, KV, Dot and Separator.

  Splitter owns the pane size and is a real `separator`, so the divider can be
  moved with the arrow keys and not only dragged. LogView owns its scroller and
  follows the tail, so consumers do not each rebuild that. Dot spells status as a
  `variant` prop, the way Badge already does, rather than as utility classes.

- 8f2ebff: Export the components the gallery demonstrated but the package never shipped:
  Textarea, Search, Select, Switch, ValidationMessage, EmptyState, Header,
  PageHeader, Sidebar, Navigation, Breadcrumb, Link, Pagination, Tabs, Alert,
  Spinner, Skeleton, Toast, Drawer, Popover, DropdownMenu, Tooltip, and
  CommandPalette. Dialog comes with them, because Drawer is a Dialog moved to an
  edge and the task dialog had no export either.

  Navigation, Sidebar, and Link stay out of routing: the product marks the
  current destination with `active` and passes `asChild` for its own link
  component. CommandPalette is controlled and owns the overlay, focus, and its
  Arrow, Enter, and Escape keys; the product owns the shortcut that opens it and
  the filtering behind it.

### Patch Changes

- 04f6d81: Stop the dialog surface from showing two scrollbars on content that fits. The
  corner marks are drawn outside the surface, so `overflow-y: auto` on the same
  element had something to scroll to at every size. The surface is now a flex
  column and the content region scrolls.
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

- Updated dependencies [266747b]
- Updated dependencies [d716077]
- Updated dependencies [4b6b6bc]
  - @momoi-labs/kiso@0.6.0

## 0.2.0

### Minor Changes

- 8670908: Add BrandMark for decorative letters and SVG icons beside product names, with
  the momoi-labs TerminalIcon glyph. Document the component contract and preserve
  the existing CSS output.

### Patch Changes

- Updated dependencies [8670908]
  - @momoi-labs/kiso@0.5.0

## 0.1.0

### Minor Changes

- 7cd3e6c: Add React components backed by Kiso styles and Radix behavior, with typed exports
  and a stylesheet that loads the Kiso dependency.
