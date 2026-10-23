# @momoi-labs/kiso-react

## 0.21.0

### Minor Changes

- 0669d27: Kiso pages print. On paper they use the light scheme, hide the shell,
  navigation, actions and interactive chart parts, lay grids out as blocks so
  Chrome paginates them, stop tables and pane bodies from scrolling, open closed
  Disclosures and drop pane frames.
  
  A new Report pattern sets a sheet-wide `.report` page with A4 margins, a page
  number footer, one page per section, document section headings and a
  `.report-kicker` for the cover. PaneGrid and DashboardGrid take `static` for
  one column with nothing to move or resize. In a report, a Chart's caption
  hides in a pane wherever the chart sits.
  
  On paper a table grows to hold all its rows, with its footer after them, even
  when the product bounds its height. Headings, numbers and tight columns wrap
  so a wide table fits the sheet.

### Patch Changes

- Updated dependencies [0669d27]
  - @momoi-labs/kiso@0.26.0

## 0.20.0

### Minor Changes

- 7448630: Synchronized charts no longer stall on pointer moves. Only the inspected
  chart shows the floating readout and crosshair; the other charts with the
  same `syncId` draw a dashed line and dots at the same timestamp. A click or
  tap without a drag pins the timestamp across the group with its values, and
  a second click or Escape clears it. Enter or Space on a focused plot pins the
  sample inspected with the keyboard.

### Patch Changes

- Updated dependencies [7448630]
- Updated dependencies [4bc8010]
  - @momoi-labs/kiso@0.25.0

## 0.19.1

### Patch Changes

- Updated dependencies [ffa0947]
  - @momoi-labs/kiso@0.24.0

## 0.19.0

### Minor Changes

- 543ea7e: The table legend takes a `summary` prop on `Chart` and `ChartLegend` that
  lists its columns in order. Besides `min`, `max`, `avg` and `current`, it
  offers `p50`, `p75`, `p90`, `p95` and `p99`, so spiky measures such as
  latency can show percentiles instead of a max set by one outlier. The
  default columns do not change.
- d5d0243: Chart takes `onRangeSelect`. A reader drags across the plot with a mouse or
  pen, and a tinted band marks the samples between both ends. Release calls
  `onRangeSelect` with the ordered `{ from, to }` timestamps. A click or Escape
  selects nothing. The product applies the range, usually through
  TimeRangeControl, which stays the keyboard and touch path. The plot shows a
  crosshair cursor while a range can be selected.
- 93ac35a: DashboardPanel takes `expandable`. The panel gets an Expand control with a
  maximize icon, and `V` opens the focused panel, or the one under the pointer,
  in a dialog that fills the viewport. `Escape`, `V` or Close returns focus to
  where it was. A Chart in the expanded panel takes the height the dialog leaves
  and stops synchronizing with the Charts on the grid. Expanding never writes to
  the layout.

### Patch Changes

- Updated dependencies [543ea7e]
- Updated dependencies [d5d0243]
- Updated dependencies [93ac35a]
  - @momoi-labs/kiso@0.23.0

## 0.18.0

### Minor Changes

- c52ea50: Chart and ChartLegend accept any number of series. Slots 1 to 5 keep the
  validated palette. Slot 6 and later get a generated color in the same
  lightness band for each theme, starting with the hues between the palette's
  own. Generated colors are not checked for color-vision deficiency, so the
  numbered label and exact values carry identity.
- 99b05a4: Chart treatment splits into a line and a fill, so a curved line can keep the
  dot screen. `data-chart-line` takes `straight`, `stepped` or `curved`.
  `data-chart-fill` takes `none`, `dots`, `tint`, `squares` or `scanlines`.
  `data-chart-style` stays as a preset of both, and the new attributes override
  one axis. Chart and Sparkline add `chartLine` and `chartFill` props. Chart and
  Sparkline now mark their treatment with `data-line` and `data-fill` instead of
  `data-chart-treatment`. A gauge keeps a solid value with any fill, and its
  track is plain with none or tint.
  
  Chart layout and legend placement are inheritable too. `data-chart-layout`
  takes `standard`, `compact` or `split`, and `data-chart-legend` takes `table`,
  `inline` or `sidebar`. The `layout` and `legend` props override them. An
  inherited split leaves a stacked chart on one plot.
- f9291d2: DashboardGrid is now a PaneGrid, so readers can move and resize dashboard
  panels. DashboardPanel is a GridPane and needs an `id` and a `title`. Its
  `size` replaces `span`, and the panel is the Card, so put the widget in it
  directly. DashboardGrid takes PaneGrid's `layout`, `defaultLayout` and
  `onLayoutChange`, so the product can save the layout. The `.dashboard-grid`
  and `.dashboard-panel` CSS no longer sets columns. A Chart inside a pane
  hides its caption visually, since the pane title names it.

### Patch Changes

- Updated dependencies [c52ea50]
- Updated dependencies [99b05a4]
- Updated dependencies [f9291d2]
- Updated dependencies [99b05a4]
  - @momoi-labs/kiso@0.22.0

## 0.17.0

### Minor Changes

- 9b24980: Add `ImagePreview`, `AudioPreview` and `DetailOption`. An option can now show
  an image thumbnail or a sound that plays from a button, and `DetailOption`
  lays out an illustrated option in a list the product owns, such as an
  autocomplete. In DetailSelect, Ctrl+Enter or Cmd+Enter plays the focused
  option's audio without choosing it; `isPlayPreviewKey` and
  `toggleAudioPreview` give other lists the same key. Previews never play by
  themselves, and one plays at a time.

### Patch Changes

- Updated dependencies [9b24980]
  - @momoi-labs/kiso@0.21.0

## 0.16.2

### Patch Changes

- 941ec52: Draw a diagram edge's trunk in the edge's line and tone when every edge that leaves the source agrees, so a single dotted edge is dotted end to end.

## 0.16.1

### Patch Changes

- e1973ba: ApplicationShell with `phoneNavigation="bottom"` now shows `primaryAction` in the header, after the brand, below 700px. Before, the menu button was hidden and neither the bar nor the More sheet held it, so a phone could not reach it. A menu passed as `primaryAction` opens from the header. From 700px the drawer and sidebar hold it as before.
- Updated dependencies [e1973ba]
- Updated dependencies [da2fa9d]
- Updated dependencies [6fc79f4]
- Updated dependencies [6460ce3]
  - @momoi-labs/kiso@0.20.3

## 0.16.0

### Minor Changes

- 115a322: Add CodeEditor, a native textarea for short code with line numbers and a highlight the product provides.
  
  - One field frame holds the gutter and the code, so every border style, corner style and frame scope draws a single contour. Inner parts have no fill of their own, so Pixel corners stay visible.
  - `highlight` returns React nodes or HTML as `{ __html }`, as from Prism. Kiso ships no highlighter. Without one, or under forced colors, the textarea shows its own text.
  - `lineNumbers` turns the gutter on or off. The gutter and the highlight follow the textarea on both scroll axes and use the same font metrics.
  - Focus, invalid and disabled states reach the frame inside FormField.
- 9f0f91f: Fit the inset app shell to phones. Below 700px wide the inset frame now meets
  the screen edges: no outer padding, canvas margin, border, corners or corner
  marks. Wider screens are unchanged. `data-app-shell-outer` on `html` chooses
  `full`, `compact` or `none` at every width instead; `auto`, the default, keeps
  the new behavior.
  
  Add `BottomNav`, `BottomNavLink` and `BottomNavBadge` for a phone's main
  destinations in a bar fixed to the bottom edge below 700px. A sidebar
  ApplicationShell builds the bar from its navigation with
  `phoneNavigation="bottom"` and keeps the drawer between 700px and 1023px.
  With more than five destinations, the bar shows four and a More button that
  opens the rest, with the footer, in a bottom sheet. A
  top-bar ApplicationShell takes a BottomNav in its `bottomNav` slot. The shell
  reserves space so the last content scrolls clear of the bar.
  
  `.topbar` now has a minimum height instead of a fixed one, so wrapped header
  content stays inside it. Header content taller than 52px now grows the bar
  instead of spilling over its border. The Momoi watermark is at most 64px wide
  below 700px, and it now sits 8px inside the frame's corner instead of on the
  frame's border.
- e3b7a11: ApplicationShell, Tabs and Lifecycle now fit a phone.
  
  - ApplicationShell: below 1024px the sidebar leaves the page and opens as a drawer from a menu button at the start of the header. The drawer holds the brand, the primary action, the navigation and the footer, and closes when a destination is picked. Pass `drawerOpen` and `onDrawerOpenChange` to close it from somewhere the drawer cannot see, such as a menu that opens in a portal. A sidebar laid out by hand with AppShell keeps the stacked navigation.
  - Tabs: the new `sections` prop shows each panel under a header of its own below 1024px, one open at a time, instead of a strip of triggers that cannot fit. The panels are the same elements in both layouts, so crossing the breakpoint keeps an edited form or a running terminal.
  - Lifecycle: at 720px and below the status stays in the row and every action moves into a bottom sheet behind a "More actions" button. `actionsLabel` names the sheet. Status badges wrap instead of running off the screen.

### Patch Changes

- 3a06bac: Fix components that broke on phone screens. Fields use 16px text on touch
  screens, so iOS no longer zooms the page when one takes focus. A long chip
  keeps its remove button in reach, chip suggestions scroll into view, and
  editing a chip value no longer hides its first letter. A toast fits a 320px
  screen. Tab labels keep their width, the strip scrolls inside itself, and a
  disabled tab looks disabled. A breadcrumb wraps and its links take touch
  height. Page actions go under the title below 560px. Table numbers keep their
  unit on one line. A side drawer keeps fields under their labels. A
  controlled command palette returns focus to the control that opened it. On
  touch, a pane header scrolls the page and a grip moves the pane. Placeholders
  stay muted over patterned backgrounds. Accent pills and DetailSelect
  illustrations fit touch screens.
- 00d6ba8: Phone polish from the component review.
  
  - Chart: the last x-axis label is no longer cut.
  - Table, Chart data table, ChartLegend, Diagram and horizontal Steps fade the edge that has more content behind it when they scroll sideways.
  - Steps: a horizontal list no longer breaks words mid-word. It scrolls instead.
  - Button `xs` is 44px wide on a coarse pointer.
  - Select: the listbox is never narrower than its trigger.
  - Bottom sheets keep their content above the safe area at the bottom of the screen.
  - AlertDialog: tapping the backdrop keeps focus inside the dialog.
  - KV: the key column takes at most 30% of the list when the list is narrow.
- Updated dependencies [115a322]
- Updated dependencies [9118a27]
- Updated dependencies [47e44fd]
- Updated dependencies [b0dac0e]
- Updated dependencies [9f0f91f]
- Updated dependencies [3a06bac]
- Updated dependencies [e3b7a11]
- Updated dependencies [00d6ba8]
  - @momoi-labs/kiso@0.20.0

## 0.15.0

### Minor Changes

- 28d8ed8: Let Diagram draw structured summaries. Nodes take facts (`DiagramFact`), a
  fold with a count (`DiagramFold`), filter chips (`DiagramFilter`), sections
  with an action (`DiagramSection`) and tree lines (`DiagramLine`).
  `DiagramNodeGroup` draws several nodes as one card. `title` is optional and
  takes any node, and an icon without a caption leads the title.
  
  The canvas now fills its panel and wraps node text to fit; a drawing too
  wide even when wrapped keeps its natural width and scrolls.
  Columns sit together in the middle instead of stretching. The column gap
  shrinks when no edge has a label. Several edges into one target each get
  their own entry point, so their labels no longer overlap. The scroll region
  is `role="group"` instead of `role="img"`, so assistive technology reaches
  the controls inside nodes.

### Patch Changes

- Updated dependencies [28d8ed8]
  - @momoi-labs/kiso@0.19.0

## 0.14.0

### Minor Changes

- 435a61c: Add Diagram: columns of typed nodes (route, service, repository, image,
  database, or a custom icon) joined by elbow edges with optional labels,
  dashed or dotted lines and a status tone. Nodes are Cards with a title, free
  text and an optional stopped or failed status.
  They follow the page's appearance, or take their own border style, corner
  style, corner size and corner marks on the diagram, with a per-node override
  for one node that is down. The diagram is a panel that paints the page's
  canvas background, or one of the shell's background styles of its own, and
  it keeps its width on narrow screens by scrolling instead of reflowing. Icons come from `lucide-react`, which is
  now a peer dependency of `@momoi-labs/kiso-react`.
- 974339e: Add `flow="masonry"` to PaneGrid. Panes keep their natural heights and take
  the shortest free column space in their row, so short cards no longer leave
  gaps below them. Rows stay separate groups. Masonry ignores `fill`, and
  `overflow="scroll"` keeps the rows flow.
- 8bb6a01: Add PaneGrid and GridPane. A PaneGrid lays an object's summary panes out on
  twelve columns in rows. The reader resizes a pane at its end edge, up to the
  free columns of its line, and moves it by its title, into a row or onto a
  row of its own. Sizes never change on a move. A row wider than twelve columns
  wraps onto more lines, or scrolls with `overflow="scroll"`. `fill` spends a
  line's free columns on screen and `pack` orders a row by size. The grid
  reports every change through `onLayoutChange` for the product to persist,
  scales to six columns below 1024px and stacks below 640px.
- 573ca6c: Add Solid, Pixel, Halftone and Rounded chart treatments and a DetailSelect component with illustrated rich options in a bounded overlay.
- 45862a1: Add PasswordInput, a masked secret field with an accessible Show/Hide action, and update the login pattern with a context panel, pending protection and separate credential, service and network errors.

### Patch Changes

- bf89a8c: Draw generic component icons with Lucide. Search, CommandPalette, Select,
  DetailSelect, ChipInput, Steps, ApplicationShell, AppShellPanelToggle,
  ThemeSelector, and TimeRangeControl now render Lucide icons in
  place of hand-drawn SVGs and text glyphs. `lucide-react` is already a peer
  dependency.
- a4bdb91: PaneGrid picks its twelve, six or one columns from its own width instead of
  the viewport. A grid beside a sidebar or an open panel no longer squeezes
  twelve columns into a narrow space. The breakpoints and saved sizes do not
  change.
- 59f8f78: Remove the dotted grip from the GridPane head. The head is still the drag
  handle and shows the grab cursor.
- d896a20: With `data-frame-scope="all"`, control-sized surfaces now follow the selected
  corners: BrandMark, Badge, Alert, Lifecycle clusters, chips, FilterInput groups,
  Skeleton, segmented tracks, menus, popovers, tooltips, toasts, and the
  ThemeSelector and AccentSelector frames. They take Asymmetric corners, Pixel
  steps in their own border color, and the Manga and Brush contour. Extra-small
  buttons and the current Pagination page now take Pixel steps too.
- Updated dependencies [435a61c]
- Updated dependencies [a4bdb91]
- Updated dependencies [974339e]
- Updated dependencies [59f8f78]
- Updated dependencies [8bb6a01]
- Updated dependencies [573ca6c]
- Updated dependencies [d896a20]
- Updated dependencies [45862a1]
  - @momoi-labs/kiso@0.18.0

## 0.13.0

### Minor Changes

- 9d84a7b: Add red, gold, and lime accents and make Momoi backgrounds follow the active accent.
- 8f92e5a: Let products virtualize LogView. `LogViewHandle` adds `getScrollElement()`,
  which returns the internal scroller to hand to a virtualizer such as TanStack
  Virtual. Follow-tail no longer pulls back a reader who leaves the end in small
  steps while a virtualized body re-renders its rows. The LogView contract
  explains how to compose a virtualized body.

### Patch Changes

- Updated dependencies [9d84a7b]
- Updated dependencies [8f92e5a]
  - @momoi-labs/kiso@0.17.0

## 0.12.0

### Minor Changes

- 843c554: Add generic guided-input controls, 56px sizes, plain headers, and the Tangerine accent in both themes.
  
  With `data-frame-scope="all"`, Square corners now also square controls,
  switches included, and Manga and Brush draw controls with the panels' irregular
  contour instead of a compact outline.
- b98c6b8: Slide the selection marker of Tabs, Segmented tracks, ThemeSelector buttons,
  Sidebar navigation and Navigation rows to the newly selected item where CSS
  anchor positioning is supported. The resting look is unchanged. Other
  browsers, right-to-left layouts and reduced motion keep the instant change.

### Patch Changes

- Updated dependencies [843c554]
- Updated dependencies [b98c6b8]
  - @momoi-labs/kiso@0.16.0

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
