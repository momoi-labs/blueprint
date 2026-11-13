# Terminal interfaces

These rules govern Kiso products drawn in a terminal: live views, monitors,
forms and progress screens built with a TUI library such as ratatui. A
terminal cannot load `ui.css` or the token CSS, so this file says how the
web contracts carry over. A product-specific exception must be recorded in
the product's `docs/kiso.md`.

Rust products draw with the `tui-kiso` crate, built on ratatui and
`kiso-tokens`. Each component's doc has a Terminal section with its
terminal form, and the [component table](#components) below lists them all.
The `tui-kiso` gallery draws every component, and pg-probe is the product
that proved the rules.

## Principle

A web component keeps its name, its anatomy and its states in the terminal
wherever they fit. The goal is the web experience in cells, not parity for
its own sake. When a component does not fit a terminal, it gets no widget,
and its doc says what to use instead.

A cell is a fixed box, so three things change:

- A surface is a fill of cells. There are no borders, radii or shadows to
  draw, so a card is a block of color with half a row above and below.
- Pointer states mostly vanish. Focus and selection carry the interaction.
- Layout is a grid of whole columns, and a narrow screen gets a longer page
  and not a cut one.

## What carries over unchanged

- [Principles](principles.md) and [voice and tone](voice-and-tone.md).
- [Data-heavy interfaces](data-interfaces.md): right-aligned numeric columns
  and headers, one unit per column, SI or IEC units by source, and the
  unknown value. A monospace font gives tabular figures, but numbers still
  align right.
- [Patterns](patterns/README.md). A terminal view picks a pattern, such as
  [dashboard](patterns/dashboard.md), [list-detail](patterns/list-detail.md)
  or [large data tables](patterns/large-data-tables.md), and the product
  records it in Pattern choices.
- [Keyboard shortcuts](patterns/keyboard-shortcuts.md), with the terminal
  rules in [Keys](#keys).

## Color

- Take colors from the generated tokens. Rust products use the `kiso-tokens`
  crate. Never copy hex values by hand. For another language, propose a
  generator in the token build.
- Use semantic roles only, never palette steps such as `dark.700`.
- Use the dark theme by default, in both OS themes. A light theme is fine
  when the person picks it; state text then takes the light theme's state
  colors in place of the `*-on-dark` roles.
- Set the terminal's own background to `background` with OSC 11 and its
  text color to `foreground` with OSC 10 when the view starts, and restore
  both with OSC 111 and OSC 110 when it quits. Leave the cells unpainted,
  so the terminal's transparency shows, and text without a color of its
  own reads as `foreground`. A terminal's own background, often light,
  breaks the dark values' contrast. This is why `*-on-dark` roles exist
  (see [tokens](tokens.md)). A product that must run where OSC 11 does not
  work paints `background` on every cell instead.
- Use one accent, the one the product's web UI uses, and record it in
  `docs/kiso.md`. In Rust that is one constant, such as
  `kiso_tokens::GOLD_DARK`.
- Status text uses `success-on-dark`, `warning-on-dark`, `danger-on-dark`
  and `info-on-dark`. Categorical series use `chart-1` to `chart-5` in
  order.
- Never fall back to the 16 named ANSI colors. The user's terminal theme
  redefines them.

In `tui-kiso`, `Theme::new(kiso_tokens::GOLD_DARK)` applies these rules: it
reads `COLORTERM`, maps colors and picks `selected`. `Theme::truecolor` and
`Theme::xterm_256` fix the color depth, for tests and snapshots. The theme
gives a ratatui style per role, such as `base`, `muted`, `selected` and
`danger`. `Accent::tokens` gives the tokens of a dark or light theme, and
`set_background` and `set_foreground` send OSC 11 and OSC 10.

### Color depth

Send 24-bit color only when `COLORTERM` is `truecolor` or `24bit`. Other
terminals, such as tmux on many servers, read RGB codes as other
attributes. Map each color to the nearest of the 256 xterm colors instead.

A blend of two colors bands in 256 colors, so each component that blends
keeps one whole color there. The result is flatter and still readable.

| Part | Truecolor | 256 colors |
| --- | --- | --- |
| `selected` | A blend of the accent into `background` | The nearest cube color within 25 degrees of the accent's hue that keeps 4.5:1 with the text. Distance alone is wrong: for the gold accent the nearest color is a grey |
| Card fill | `Look.fill` sets how much of the backdrop shows | Always `Solid`: the card color alone |
| Half rows of a card | Blend with the cell under them | The card color, whole |
| `Backdrop` `Glow` | A wash of `primary` from two corners | Draws nothing |
| `Backdrop` patterns | A blend of `foreground` into `background` | The nearest cube color |
| `Scrim` | Each cell blends 60% toward `background` | Text turns `subtle-foreground`, and the fill stays |
| Table header and log lines | `secondary` at the strength of `Look.fill` | `secondary`, whole |
| Round ends | The same | The same, with a Nerd Font |

Check contrast after the mapping, against the colors the terminal draws.
`Theme::xterm_256` and the gallery option `--256` show this view.

## Surfaces

A page has no line borders. A section is a title and a rule. Related
content sits on a card, which is a fill. Nothing in the crate draws a drop
shadow.

| Element | Style |
| --- | --- |
| Screen | Unpainted: the terminal's background, set to `background`. A `Backdrop` can draw a wash or a pattern first |
| Brand | Product name and version, bold `primary-foreground` on `primary`, in the header or at the top of the sidebar |
| Page title | The title in bold `foreground` in the middle of the title line across the page: a heavy `━` in `primary` |
| Section | The title in `muted-foreground`, then the section rule to the edge: a thin `─` in `border`. A count can end the rule |
| Column titles | `muted-foreground` on a faint `secondary` fill in a `Table`; `subtle-foreground` and no fill in the rows of a `Page` |
| Selected row | A `primary` `▌` in the first column and the `selected` background. Text keeps its role colors |
| Card | `card` fill with half a row of fill above and below, square corners, no line. The `popover` color when it is Elevated |
| Code block | A card surface, with half a row of fill above and below |
| Button | Two columns of padding and half a row of fill above and below. See [Focus, hover and disabled](#focus-hover-and-disabled) |
| Overlay | An opaque `popover` fill with half a row above and below. See [Overlays](#overlays) |
| Toast | A small Elevated card with the tone's glyph, a bold label and the message |
| Secondary text | `muted-foreground` |
| Tree branches, rules and other non-text marks | `subtle-foreground` or `border` |
| Key hint | Key in `foreground`, label in `muted-foreground`, a `•` in `border` between hints. The current view's label is bold `foreground` |

### Card fill and half rows

A card is a block of fill. Its first and last rows hold half a row of fill:
`▄` on the row above the content and `▀` on the row below. The card has
padding without the cost of two rows. The corners are square.

`Look.fill` says how much of the backdrop shows through:

- `Glass` (the default): the card color blends with the cell under it, so
  the backdrop shows through.
- `Translucent`: a trace of the backdrop shows.
- `Solid`: the card color alone.

A card blends its fill over the background color under it, so the backdrop
shows through, and it replaces the text under it. A widget that draws over
cells it does not own reads the cell under it and blends, and never clears
the whole area.

### Border

`Look.border` has two values. `None` is the default. `Rail` draws half a
column of `primary` in the cell before the card: `▗` on the first row, `▐`
on the middle rows and `▝` on the last row. The card keeps its size. The
terminal has no line border, no edge border and no corner options.

### Corners and round ends

Filled shapes have square corners. `Look.round` turns on round ends for
badges, pills and small buttons. It needs a Nerd Font, so it is off by
default and a product turns it on only when it knows the font is there. The
ends are the Nerd Font half-circle glyphs U+E0B6 and U+E0B4.

### Look

The title line, the section rule, the card fill, the border and the round
option are product options in one `Look`. `Theme::with_look` sets it. The
title and the rule each take a pattern, such as `━`, `─`, `░` or `╱`, and an
ink: `primary`, the `primary` to `chart-1` gradient, or a faint `border`.
`Look::DEFAULT` is a heavy `primary` title line, a faint thin rule, glass
cards, no border and square ends.

### Contrast on a selection

- A selected row changes only its background and gets the `▌`. Status marks
  and words keep their colors, so a failed row stays red when selected.
- Some roles miss their minimum on `selected`. In most dark accents,
  `muted-foreground`, `link` and `danger-on-dark` fall below 4.5:1, and in
  teal, cobalt and nocturne `subtle-foreground` falls below 3:1.
  `foreground` passes in every accent. Gold and lime are the only accents
  where every role passes.
- On a selected row, a cell that misses its minimum takes `foreground`. The
  minimum is 4.5:1 for text and 3:1 for a mark, such as ● or a sparkline. A
  status word in `success-on-dark`, `warning-on-dark`, `danger-on-dark` or
  `info-on-dark` that loses its color turns bold. A neutral status is
  `muted-foreground` text: it takes `foreground` like other secondary text,
  and its `○` and word still name it.
- A brand mark leads with the product name and version, so a screenshot says
  which tool and release produced it.
- A full-screen view is a page. Draw it with the same header or sidebar,
  section rules and footer as the main view. An overlay is for content that
  sits over a page and closes back to it: help, a question, a picker, the
  command palette or a short form.

## Overlays

An overlay sits over the page and owns every cell it covers. Two kinds
share one surface:

- A modal layer dims the page first. `Scrim` blends each cell toward
  `background` and keeps its glyph, so the page stays readable and the
  overlay reads as the one thing to act on. Draw the scrim once, over the
  whole screen, and nothing between it and the overlay. `Modal`, `Drawer`,
  `CommandPalette`, `Question` and `ThemePicker` draw it themselves.
- A light layer leaves the page lit. `Popover`, `DropdownMenu` and
  `OptionList` have no scrim. `Esc` or a move away closes them.

The surface is an Elevated card in the `popover` color, always opaque
whatever `Look.fill` says, with half a row above and below, square corners,
no line and no shadow. The overlay erases only what the page drew under it,
and it does not touch a cell outside its area.

| Overlay | Position | Scrim |
| --- | --- | --- |
| `Modal` | Centered, 3, 4 or 6 grid tracks wide for `Sm`, `Md` and `Lg` | Yes |
| `Question` | A `Modal` with facts, a card of what will happen, and buttons | Yes |
| `Drawer` | The full height of the screen, against the right edge or the left | Yes |
| `CommandPalette` | Top third of the screen, 4 grid tracks wide | Yes |
| `ThemePicker` | An Elevated card with dark or light on top and one row per accent | Yes |
| `Popover` | Under its anchor, or above it with no room below, shifted left to stay on screen | No |
| `DropdownMenu` | Under the selected row, two columns in, or above it | No |
| `OptionList` | Under the field of a `Select` or `Combobox`, or above it | No |

A modal layer keeps two columns from each side of the screen and a row from
the top and the bottom. A dialog has a bold title, the body, and a footer
with the key hints on the left and the buttons against the right edge, the
primary one last. `Esc` closes every overlay: say so in the hints.

## Layout

### Grid

`Grid` is the layout rule of a page. It draws nothing and gives areas.

- A track is 13 columns. Two columns part two tracks.
- A page has 3 tracks or more, by the width of the area. A contained page
  has 6 at most. See [page width](patterns/page-layout.md#terminal).
- A cell takes whole tracks. A cell that does not fit in the open row
  starts the next row, so a narrow terminal gets a longer page and not a
  cut one.
- One blank row parts two rows of cells, and one blank row parts a caption
  from its card.
- Sizes of Modal, Drawer and CommandPalette are whole tracks too.

### Screen

`AppShell` lays out the screen and draws nothing. It returns the areas of
the app bar, the sidebar, the page and the footer.

- The screen keeps two columns on each side. The footer is the last row. A
  header takes the first row, and an empty row follows it.
- Minimum size is 80 by 24. Under it, `AppShell::too_small` is true: draw
  `AppShell::message` and nothing else. The help screen and every dialog
  fit in 24 lines. A dialog keeps a row of the page above and below while
  its content fits, then takes the whole height. If the body is still
  cut, the dialog drops its half rows and the empty row above its footer:
  with a title and key hints, 21 rows are left for the body.
- The navigation is a sidebar on the left, or on the right as a product
  option. It is as wide as its longest line, from 20 to 32 columns, and
  sits four columns from the page.
- From 100 columns the sidebar sits beside the page. Under 100 columns, or
  when the page would get fewer than 60, it collapses into an overlay that
  a key opens.
- Give spare width to the widest value, such as query text. A compact mode
  may merge columns (`user@database`) or shorten values (`act`, `txn`).
- Spell out every abbreviation on the help screen, not on the main screen.
- Drop a column that cannot hold data in the current context, such as a
  field the server version does not provide. Do not show a column of
  unknown values.

### Scrollbar

A page longer than the screen scrolls, and the selection stays on screen.
The scrollbar has no arrows: a `│` track in `border` and a thumb in
`primary`, in the second column right of the page. `Page` and `Table` draw
it, a `Table` in its last column. The mouse wheel scrolls too, in an app
that reads it.

### Lists and details

- Filters are one select per facet, each on "All" until the person picks
  something. While any facet filters the list, the row under the page's
  description says which, with the keys to change them, and section counts
  read "3 of 5". A row shows when it passes the search and every facet.
- A record's details open as a page in place of the list, not as a side
  panel, which would leave the list too narrow. Going back shows the list
  as it was: the same search, filters, selected row and scroll.
- A detail page with several views has tabs on its title line. The current
  one reads as "laya · Summary" in the middle of the line; the others stay
  short.
- The actions of a row open in a `DropdownMenu` right under it, or above it
  near the bottom of the screen: the terminal form of a `⋯` menu. A
  destructive action is in `danger-on-dark`, and selected it takes the
  `danger` fill.

## Focus, hover and disabled

One rule covers every component. Focus is the one signal of where the keys
go, and it has two forms.

| Form | Where | Look |
| --- | --- | --- |
| Half-cell bars | A control with its own surface: `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, and `Button` of size `Md` | Half a cell of `focus` on each side, `▐` before and `▌` after. Leave one free cell each side |
| Selection fill | A row in a list: `Page` items, `Table`, `Sidebar`, `DetailSelect`, the rows of a `Form` | The `selected` background and a `primary` `▌` in the first column |
| Primary fill | A row in an overlay list: `DropdownMenu`, `OptionList`, `CommandPalette` | `primary-foreground` on `primary` across the row. A destructive row takes the `danger` fill |

- A row that shows the selection does not draw bars on its control. The
  row is the focus. An invalid control keeps its `danger` bars with or
  without focus.
- A `Button` of size `Sm` has no room for bars: its two padding cells take
  the `focus` color. `Link` takes `primary-foreground` on `primary`, as a
  selected row does.
- Hover has no pointer in the terminal. `tui-kiso` does not track the
  mouse. A widget with a `Hover` state, such as `Button`, `Switch`, `Link`
  and `Card`, draws it when the app sets it, for an app that reads mouse
  events. Keys never depend on it, and no state may show only on hover.
- Disabled uses the `disabled` text on the `disabled-surface` fill, with no
  underline on a `Button`. A disabled item keeps its place, `↑` `↓` skip
  it, and its contrast is exempt from the minimum.
- Loading is a braille frame before the label, or a `Skeleton` where the
  content will be. Error is text under the control.

## Backdrop

`Backdrop` is a separate widget. Draw it once per screen, before everything
else, so glass cards let it show through.

| Canvas | What it draws |
| --- | --- |
| `Glow` (the default) | A wash of `primary` from two corners, over the first 40 rows. Draws nothing in 256 colors |
| `Solid` | The `background` alone. Draws nothing |
| `Dots` | `·` every 4 columns and 2 rows |
| `Grid` | Lines of `│` and `─` that cross at `┼` |
| `Crosses` | `+` in staggered rows |
| `Stripes` | `╱` on a diagonal |

`.strong(true)` makes the wash or the pattern stronger. The default is
quiet. A pattern is a blend of `foreground` into `background`.

## Forms

A form uses one style across the crate: a label column, and the list
selection as the focus.

- The label sits in a column on the left and the value on the same row, as
  in a list. Focus is the selected row, and the field's hint or error goes
  on the row under it.
- A field is a `Control`: text, secret, area, checkbox, switch, radio,
  select, combobox or chips. The same name in the web is `Input`,
  `Textarea`, `Checkbox`, `Switch`, `RadioGroup`, `Select`, `Combobox` and
  `ChipInput`.
- A `Select` in a form is the compact `‹ value ›`. `←` `→` change it, and
  `Enter` opens its list.
- The buttons end the form, in `FormActions`, the primary one last.
  `Form::button_state(i)` gives the state of button `i`, and
  `Form::actions` builds the row.
- A short form, up to four fields, is a dialog. A form that creates
  something is a page. Editing one section of a detail page happens in
  place. All three keep the same rows.

## Keys

- `?` opens help: a dialog over the current layer that lists every key,
  grouped by where it works. Any key closes it. `F1` opens it too, so help
  stays reachable while a text input has focus.
- `q` and `Esc` close the top layer, one layer at a time. `q` quits only
  from the main view. `Esc` never quits. In a text field `q` is text, so
  only `Esc` closes. A record's details are a layer: `q` and `Esc` go back
  to the list.
- Keys go to the top layer only, in this order: an overlay, a form, the
  search while typing, a record's details, then the page. On a list page,
  `Esc` clears the search first, then the filters, then moves focus to the
  sidebar.
- `Ctrl+C` quits from anywhere, help included. While a job runs, it first
  asks in a dialog that says what stops and what stays done. A second
  `Ctrl+C` quits without asking.
- `Ctrl+P` opens the command palette, as in Crush. `:` is an alias,
  except in a text field. Do not use `Ctrl+K`: shells use it to delete to
  the end of the line.
- `/` searches the lists on the page as the person types. The matches are
  marked, a section's count becomes "3 of 5", and a section with no match
  hides. `Enter` keeps the search and `Esc` clears it.
- `f` opens the filters, on a list page that has them. `↑` `↓` choose the
  facet and `←` `→` its value, and the page follows each change. `Enter`
  keeps the filters; `Esc` puts back the filters and the selected row from
  before. The same key may mean something else on another layer, such as
  the functions of a query in pg-probe.
- `a` opens the actions of the selected row. `↑` `↓` and `Enter`, or an
  action's own key, run one.
- `[` and `]` move between the tabs of a detail page, where the number
  keys already open pages.
- In a form, `Tab` and `Shift+Tab` move between fields, and `↑` `↓` too,
  except in a list of options. Typing edits the focused field, so `j`, `k`
  and `q` are text there. `Enter` moves to the next field and submits from
  the last one. `Ctrl+S` submits from any field. `Esc` cancels, and asks
  first when something changed.
- In a `Question`, `←` `→` choose a button, `Enter` confirms it and `Esc`
  cancels.
- The footer shows the keys of the current layer in priority order. `?`
  (`F1` while typing) and `q` or `Esc` come last and always stay. When the
  width runs out, drop the lowest-priority hints, from the right. A dialog
  puts its own keys in its footer.
- Every action has a key on the help screen. The help screen is the
  terminal's visible control, so no action is hidden knowledge.

## State and output

- Remember display options, such as compact columns or an open preview,
  between runs. Save them under `$XDG_CONFIG_HOME/<product>/`, or
  `~/.config/<product>/` without it. Do not restore state that makes the
  start slower or costlier, such as a view that sends extra queries. A
  missing, broken or unwritable file falls back to the defaults and does not
  stop the view.
- When output is not a terminal, do not redraw. Append one line when
  something changes, so logs stay short.
- Work that takes a few seconds shows on the thing it changes: its status
  turns to `◐` and a word, such as "stopping", the spinner runs next to it,
  and OSC 9;4 shows the terminal's progress bar. A run with steps lists
  them as they go, each pending, running, done, skipped or failed. A toast
  says when it ends; a failure stays on the page.
- Strip control characters from any text the product did not write, such as
  query text, object names and log lines, before drawing it. A stray escape
  sequence can rewrite the screen.
- Every write to the buffer must be safe past its edge. A widget drawn
  partly off screen loses cells and does not panic.

## Accessibility

- Do not mix the terminal's default colors with Kiso colors on the same
  screen. Kiso's contrast checks hold only on Kiso's surfaces.
- Color never carries meaning alone. A state or status also has text, such
  as a word or an abbreviation explained on the help screen.
- A glyph must have a text twin: `● Running`, `× message`, `✓` beside a
  chosen option.
- The view stays usable with keys only. Mouse support is optional.

## Components

The Kiso web library has 82 component docs. The 8 Site components are out
of scope for the terminal: SiteSection, SiteHeader, SiteHeading,
SiteFooter, FeatureGrid, FeatureList, WindowFrame and PerspectiveStack.
They build marketing pages. The other 74 are in the table. A component
with no widget says what to use instead.

| Component | Terminal |
| --- | --- |
| [AccentSelector](components/accent-selector.md) | `AccentSelector` |
| [Alert](components/alert.md) | `Alert` |
| [AppShell](components/app-shell.md) | `AppShell`, `ShellAreas`. Draws nothing; gives the areas. |
| [Badge](components/badge.md) | `Badge` |
| [BarGauge](components/bar-gauge.md) | `BarGauge` |
| [BottomNav](components/bottom-nav.md) | Not in the terminal. Use `KeyHints` in the footer row of `AppShell`. |
| [BrandMark](components/brand-mark.md) | `BrandMark` |
| [Breadcrumb](components/breadcrumb.md) | `Breadcrumb` |
| [Button](components/button.md) | `Button`, `ButtonVariant`, `ButtonState` |
| [Card](components/card.md) | `Card`, `CardVariant`, `Size` |
| [Chart](components/chart.md) | `Chart`, `Series`. A braille line chart. |
| [ChartLegend](components/chart-legend.md) | `ChartLegend`. Part of `Chart`. |
| [Checkbox](components/checkbox.md) | `Checkbox` |
| [ChipInput](components/chip-input.md) | `ChipInput` |
| [CodeBlock](components/code-block.md) | `CodeBlock` |
| [CodeEditor](components/code-editor.md) | Not in the terminal. Use `Textarea` for short text, or open `$EDITOR`. |
| [Combobox](components/combobox.md) | `Combobox`, `OptionList` |
| [CommandPalette](components/command-palette.md) | `CommandPalette` |
| [DashboardGrid](components/dashboard-grid.md) | `Grid`, `Card`. `Grid` cells that each hold a `Card`. |
| [DetailOption](components/detail-option.md) | `DetailOption` |
| [DetailSelect](components/detail-select.md) | `DetailSelect` |
| [Diagram](components/diagram.md) | `Diagram`, `DiagramNode`. A reduced form: layered boxes and one-way edges. |
| [Disclosure](components/disclosure.md) | `Disclosure`, `DisclosureState` |
| [Dot](components/dot.md) | `Dot` |
| [Drawer](components/drawer.md) | `Drawer` |
| [DropdownMenu](components/dropdown-menu.md) | `DropdownMenu` |
| [EmptyState](components/empty-state.md) | `EmptyState` |
| [FileDropzone](components/file-dropzone.md) | Not in the terminal. A terminal has no drop target. Use an `Input` that takes a path. |
| [FilterInput](components/filter-input.md) | `FilterInput` |
| [Form](components/form.md) | `Form`, `Field`, `Control` |
| [FormActions](components/form-actions.md) | `FormActions` |
| [FormField](components/form-field.md) | `FormField`, `FieldLayout` |
| [Header](components/header.md) | `Header` |
| [HelperText](components/helper-text.md) | `HelperText` |
| [IconButton](components/icon-button.md) | `Button`. `Button::icon`. |
| [Input](components/input.md) | `Input` |
| [KV](components/kv.md) | `KV` |
| [Label](components/label.md) | `Label` |
| [Lifecycle](components/lifecycle.md) | `Lifecycle` |
| [Link](components/link.md) | `Link`, `LinkState` |
| [LogView](components/log-view.md) | `LogView`, `LogState`, `LogLine` |
| [MediaPreview](components/media-preview.md) | Not in the terminal. Show the facts of the file with `KV`, and a `Link` that opens it outside the terminal. |
| [Meter and Progress](components/meter.md) | `Meter` |
| [Modal / Dialog](components/modal-dialog.md) | `Modal`, `Question`. `Question` is a modal with buttons. |
| [Navigation](components/navigation.md) | `Sidebar`, `SideItem`. The items inside the `Sidebar`. |
| [PageHeader](components/page-header.md) | `PageHeader` |
| [Pagination](components/pagination.md) | `Pagination` |
| [PaneGrid / GridPane](components/pane-grid.md) | `Grid`. One pane per cell. |
| [PasswordInput](components/password-input.md) | `PasswordInput` |
| [Popover](components/popover.md) | `Popover` |
| [RadioGroup](components/radio-group.md) | `RadioGroup` |
| [ScopeSwitcher](components/scope-switcher.md) | `ScopeSwitcher` |
| [Search](components/search.md) | `Search` |
| [Select](components/select.md) | `Select`, `OptionList` |
| [Separator](components/separator.md) | `Separator` |
| [Sidebar](components/sidebar.md) | `Sidebar` |
| [Skeleton](components/skeleton.md) | `Skeleton` |
| [Sparkline](components/sparkline.md) | `Sparkline` |
| [Spinner](components/spinner.md) | `Spinner` |
| [Split / Pane / Splitter](components/split.md) | `Split`, `Axis`. Computes areas and draws the dividers. |
| [Stat](components/stat.md) | `Stat` |
| [StatusBadge](components/status-badge.md) | `StatusBadge` |
| [StepBar](components/step-bar.md) | `StepBar` |
| [StepList](components/step-list.md) | `StepList` |
| [Steps](components/steps.md) | `Steps` |
| [Switch](components/switch.md) | `Switch`, `SwitchState` |
| [Table / DataTable](components/table.md) | `Table` |
| [Tabs](components/tabs.md) | `Tabs` |
| [Textarea](components/textarea.md) | `Textarea` |
| [ThemeSelector](components/theme-selector.md) | `ThemePicker`, `PickerView` |
| [TimeRangeControl](components/time-range-control.md) | `TimeRangeControl` |
| [Toast](components/toast.md) | `Toast` |
| [Tooltip](components/tooltip.md) | Not in the terminal. Put the help where the person looks: `HelperText`, `KeyHints` or a `Popover`. |
| [ValidationMessage](components/validation-message.md) | `ValidationMessage` |

## Verify

1. Run the view in a truecolor terminal with a light theme. The terminal's
   background and text color turn to Kiso's when the view starts and come
   back when it quits.
2. Run it with 256 colors, for example `COLORTERM= TERM=screen-256color`
   inside tmux. The selected row stays visible, cards are solid and no
   gradient bands.
3. Resize to 80 by 24. The main view, the help screen and every overlay
   fit, and the sidebar collapses. Under 80 by 24, the view shows the
   too-small message and nothing else.
4. Resize to 3 tracks (under 58 columns of page). Cells wrap to the next
   row and no cell is cut.
5. If the view can run off a terminal, pipe its output, for example
   `| cat`. It appends lines and does not redraw.
6. Walk every layer with `q` and `Esc`. Each closes one layer, and only `q`
   on the main view quits.
7. Compare with the gallery:
   `cargo run --manifest-path crates/tui-kiso/Cargo.toml --example gallery`.
   The flags are `--accent <name>`, `--light` and `--256`, to try another
   theme. `--snapshot <dir>` writes every page at 100 by 30, and one at 80
   by 24, as HTML without a terminal. In the gallery, `t` opens the theme
   picker and `s` opens the appearance panel: the backdrop, the card fill,
   the border and round ends.

Some SSH sessions drop `COLORTERM`, so a truecolor terminal can get the
256-color fallback over SSH. That is expected and safe.
