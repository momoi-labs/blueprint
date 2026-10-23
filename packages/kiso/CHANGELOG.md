# @momoi-labs/kiso

## 1.0.0

### Major Changes

- bae614e: The terminal contract now follows the Crush-style look of `tui-kiso`, and
  products built on the old rules no longer match it. Breaking: the screen
  stays unpainted, with the terminal's colors set by OSC 11 and OSC 10;
  sections are a title and a rule, not a filled bar; the selected row gets a
  `▌`; dialogs have a rounded `primary` frame on `background`, not an
  elevated fill; key hints show the key in `foreground`; and `Ctrl+P` opens
  the command palette, with `:` as an alias and `Ctrl+K` no longer used.
  
  The contract adds the sidebar, scrolling, forms, the `/` search, faceted
  filters on `f`, record details as a page, tabs on a detail page, row actions
  on `a`, the order in which keys reach each layer, and how work in progress
  shows. A light theme is allowed when the person picks it. Button, Form,
  Command palette, Sidebar, Toast, Spinner, Tabs, Page header, Search, Theme
  selector, Step list, Dropdown menu and Drawer gain or update a Terminal
  section, and the filtering pattern gains one.

### Minor Changes

- 53a47fa: Chart, ChartLegend, BarGauge, Meter and Progress take a `labels` prop that
  localizes their fixed text, such as "Not collected", the summary column
  headers and the exact values disclosure. Chart passes its labels on to
  ChartLegend. The defaults keep the current English text.
- 6906cd7: The terminal contract now points Rust products at the `tui-kiso` crate and
  settles its open questions: a selected row changes only its background and
  falls back to `foreground` where a role misses contrast on `selected`, help
  is a popup, `Ctrl+C` asks before it stops a running job, `:` opens the
  command palette, and the footer drops hints from the right. Header, Table,
  StatusBadge, Modal and the keyboard shortcuts pattern gain a Terminal
  section.

## 0.26.0

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

## 0.25.0

### Minor Changes

- 7448630: Synchronized charts no longer stall on pointer moves. Only the inspected
  chart shows the floating readout and crosshair; the other charts with the
  same `syncId` draw a dashed line and dots at the same timestamp. A click or
  tap without a drag pins the timestamp across the group with its values, and
  a second click or Escape clears it. Enter or Space on a focused plot pins the
  sample inspected with the keyboard.
- 4bc8010: Add `success-on-dark`, so a terminal or log view can show success in the same
  dark-surface family as warning, danger and info. The terminal contract now
  picks the 256-color selected row by the accent's hue first, because the
  nearest color by distance turns gold into dark red.

## 0.24.0

### Minor Changes

- ffa0947: Add the terminal-interfaces contract, which says how Kiso's rules carry over
  to terminal UIs: colors, surfaces, layout, keys, saved state and checks. The
  token build also generates the `kiso-tokens` Rust crate, with every accent and
  mode as sRGB, so a terminal UI no longer copies hex values by hand.

## 0.23.0

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

## 0.22.0

### Minor Changes

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

- c52ea50: Chart and ChartLegend accept any number of series. Slots 1 to 5 keep the
  validated palette. Slot 6 and later get a generated color in the same
  lightness band for each theme, starting with the hues between the palette's
  own. Generated colors are not checked for color-vision deficiency, so the
  numbered label and exact values carry identity.
- 99b05a4: Halftone meters and bar gauges draw the value as a solid fill on a dotted track. The dotted fill was hard to read and looked like a rendering fault.

## 0.21.0

### Minor Changes

- 9b24980: Add `ImagePreview`, `AudioPreview` and `DetailOption`. An option can now show
  an image thumbnail or a sound that plays from a button, and `DetailOption`
  lays out an illustrated option in a list the product owns, such as an
  autocomplete. In DetailSelect, Ctrl+Enter or Cmd+Enter plays the focused
  option's audio without choosing it; `isPlayPreviewKey` and
  `toggleAudioPreview` give other lists the same key. Previews never play by
  themselves, and one plays at a time.

## 0.20.4

### Patch Changes

- 0987735: A neutral status badge in Lifecycle keeps a visible border on phones. At 720px and below the status badges wrap as separate shapes, and a neutral badge has a transparent border and background, so it showed as a dot and bare text next to the boxed tones. It now takes the standard border color. Standalone neutral badges and the joined cluster at 721px and wider do not change.
- f4ef9f6: A nested app shell, such as a layout preview inside a page shell, no longer repeats the page's outer border style, corner marks or ink. One outer frame is drawn and inner panels keep their own edges.

## 0.20.3

### Patch Changes

- e1973ba: ApplicationShell with `phoneNavigation="bottom"` now shows `primaryAction` in the header, after the brand, below 700px. Before, the menu button was hidden and neither the bar nor the More sheet held it, so a phone could not reach it. A menu passed as `primaryAction` opens from the header. From 700px the drawer and sidebar hold it as before.
- da2fa9d: An inset application frame with a patterned background no longer shows a dark ring around the frame. The area around the frame now uses the same paper as the inside, including accent paper, so the pattern reads as one surface. A solid background and the default frame look the same.
- 6fc79f4: Lifecycle status badges keep all four borders on phones. At 720px and below the status cluster dropped its joined frame but kept the frame's clip and Pixel contour, which cut the corners of the last badge and broke its right border. The cluster now carries no clip there, and each wrapped badge takes the corner treatment and tone border of a standalone badge. At 721px and wider the joined cluster looks as before.
- 6460ce3: Sticky FormActions now stop above the BottomNav on phones. The fixed bar covered the save bar while a tall form scrolled. A shell with a bar sets `--shell-bottom-inset` to the bar's height plus the safe area below 700px, and sticky FormActions use it as their bottom offset. Pages without a bar, and sticky actions in a `form-scroll` region, keep a zero offset.

## 0.20.2

### Patch Changes

- 0087fe9: Scatter the `momoi-repeat` background. The `>_` marks now sit in a larger
  fixed tile with varied position, size, tilt and opacity, so rows and columns no
  longer line up. Strength, paper tone and placement work as before.
- eaec6d2: Side rail, Weighted base and Offset outline now cast a shadow that follows Rounded and Asymmetric corners. The shadow sits outside the panel, to the left, below, or to the bottom right, and the panel keeps its Solid border. It no longer ends in a crescent inside the panel or leaves a gap at the corner. The outer inset frame uses its own corner style for the shadow. Square corners look the same.

## 0.20.1

### Patch Changes

- 598795b: An inset application frame with a patterned canvas now keeps the paper of the default frame. The canvas showed the darker sidebar color through the clear main area, so switching frames changed the background tone. Paper tone follows the same layer.
- bafa6a5: Draw the login context panel on `--color-card` instead of `--color-muted`. In
  the light theme `--color-muted` equals `--color-background`, so the two login
  panels blended. `--color-card` differs from the background in both themes.

## 0.20.0

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

- 9118a27: A pixel Textarea no longer paints over a layered editor. The pixel rules kept the field-control exclusion outside `:where()`, which raised their specificity to two classes. A later single-class `background: transparent` now clears the pixel fill.
- 47e44fd: Secondary text keeps its muted color on opaque surfaces over a patterned background. Inactive tabs and breadcrumb ancestors in a card, the header, a table or a dialog read as secondary again. Text on the bare canvas and on translucent panels stays at full contrast.
- b0dac0e: A PageHeader inside `.page` no longer adds block padding in the editorial style. The gap from the header to the next section now equals the section gap, 32px.
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

## 0.19.1

### Patch Changes

- de77516: A long structured chip in a ChipInput no longer shows a scrollbar. Under classic scrollbars, such as Chromium on Linux or macOS set to always show them, the bar took half the chip's height and squeezed its segments. The chip still scrolls with the wheel, touch and keyboard focus, and the segment cut at the edge shows there is more.

## 0.19.0

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

## 0.18.0

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

## 0.17.0

### Minor Changes

- 9d84a7b: Add red, gold, and lime accents and make Momoi backgrounds follow the active accent.
- 8f92e5a: Let products virtualize LogView. `LogViewHandle` adds `getScrollElement()`,
  which returns the internal scroller to hand to a virtualizer such as TanStack
  Virtual. Follow-tail no longer pulls back a reader who leaves the end in small
  steps while a virtualized body re-renders its rows. The LogView contract
  explains how to compose a virtualized body.

## 0.16.0

### Minor Changes

- 843c554: Add generic guided-input controls, 56px sizes, plain headers, and the Tangerine accent in both themes.
  
  With `data-frame-scope="all"`, Square corners now also square controls,
  switches included, and Manga and Brush draw controls with the panels' irregular
  contour instead of a compact outline.
- b98c6b8: Slide the selection marker of Tabs, Segmented tracks, ThemeSelector buttons,
  Sidebar navigation and Navigation rows to the newly selected item where CSS
  anchor positioning is supported. The resting look is unchanged. Other
  browsers, right-to-left layouts and reduced motion keep the instant change.

## 0.15.2

### Patch Changes

- 6e7f47d: Fill table and form frames to their contours, retain Pixel panel bands and
  overlays, and respect control frame scopes.

## 0.15.1

### Patch Changes

- d7e68b5: Apply the appearance settings to ChipInput and FilterInput boxes as to other
  fields. With Pixel corners, checkboxes and switches use stepped shapes, Pixel
  controls drop the rectangular drop shadow, and disabled fields keep their
  disabled surface.
- 1dc2f02: Draw the focus ring of Input, Select, Textarea, inline FormField frames and
  ChipInput boxes on the field's own edge instead of 2px outside it. With Pixel
  corners the ring follows the stepped contour. Invalid fields keep the danger
  color while focused.

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
