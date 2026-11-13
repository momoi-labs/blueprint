# tui-kiso

Kiso components for [ratatui](https://ratatui.rs) terminal interfaces. Kiso
is the Momoi Labs design system. See it at
[kiso.momoi-labs.dev](https://kiso.momoi-labs.dev).

The look follows Charm's Crush and the Kiso web look: a page has no line
borders, a section is a title and a rule, and related content sits on a
card, a block of fill with half a row above and below (`▄` and `▀`). Corners
are square, and nothing draws a shadow. In truecolor a glass card lets the
backdrop show through. Dialogs, drawers and menus sit on an opaque surface,
and a modal one dims the page behind it. Round ends need a Nerd Font and are
opt-in. Your app keeps its own event loop and layout. The widgets follow the
[terminal interfaces](https://github.com/momoi-labs/blueprint/blob/main/kiso/docs/terminal-interfaces.md)
contract, which has a table of every Kiso component and its terminal form,
and each component doc has a Terminal section.

The look is one `Look` on the `Theme`, set with `Theme::with_look`:

| Option | Values |
| --- | --- |
| `fill` | `Glass` (default), `Translucent`, `Solid` |
| `border` | `None` (default), `Rail`: half a column of the accent before a card |
| `round` | `false` (default), `true` for round ends with a Nerd Font |
| `title`, `rule` | The pattern and ink of the title line and the section rules |

In 256 colors a blend would band, so every fill draws as `Solid`.

| Part | What it is |
| --- | --- |
| `Theme`, `Accent`, `Look` | The tokens of one accent, dark or light, at the terminal's color depth, and the look |
| `Grid`, `AppShell`, `Split` | The areas of a page on tracks of 13 columns, 2 apart, 3 or more by width, wrapping; the app bar, sidebar, page and footer, with a full or contained page; panes with dividers |
| `Backdrop`, `Canvas` | The canvas behind a screen, drawn once: `Glow`, `Solid`, `Dots`, `Grid`, `Crosses`, `Stripes` |
| `Card`, `Stat` | A surface of fill for related content, and one number with its label and delta |
| `Badge`, `Dot`, `Tone`, `StatusBadge` | A label or a mark in one of five tones, and the state of a record |
| `Button`, `Switch`, `Link` | An action with a variant and a state, a setting that is on or off, and an underlined destination |
| `Input`, `PasswordInput`, `Textarea`, `Checkbox`, `RadioGroup` | Text, a secret, several lines, a choice on or off, and one of a few |
| `Select`, `Combobox`, `OptionList`, `ChipInput`, `DetailSelect` | One from a list, one from a filtered list, the open list, short values as chips, and choices with a description |
| `Form`, `Field`, `FormField`, `FormActions` | Forms with labels in a column, a field with its helper and error, and the buttons that end a form, primary last |
| `Label`, `HelperText`, `ValidationMessage` | The name of a field, and the lines under it |
| `Title`, `Tabs`, `Header`, `PageHeader`, `Breadcrumb`, `BrandMark` | Where the person is: the page title, the views of a screen, the app bar, the top of a page, the path and the product |
| `Page`, `Scroll`, `Columns`, `fact` | A page of rows that scrolls, with sections, items to select, columns and facts |
| `Sidebar`, `SideItem`, `ScopeSwitcher`, `AccentSelector` | The navigation, the scope in the app bar, and the accent swatches |
| `Table`, `Pagination`, `KV`, `LogView`, `CodeBlock` | Records in columns with a header fill and a scrollbar, the pages of a list, the facts of a record, log lines, and code on a card surface |
| `Chart`, `Series`, `ChartLegend`, `Sparkline`, `Diagram` | Series over time in braille, the trend of one series in a cell, and boxes joined by edges |
| `Meter`, `BarGauge`, `StepBar`, `StepList`, `Steps`, `Lifecycle` | A measurement against its limit, labelled measurements, the steps of a run, and the header row of a detail screen |
| `Alert`, `Spinner`, `Skeleton`, `EmptyState`, `Toast` | A tinted message, a braille spinner, loading blocks, a region with nothing in it, and a short notice |
| `Modal`, `Question`, `Drawer`, `Scrim` | Dialogs on an opaque surface over a dimmed page: help or your own content, a question with buttons, a side panel |
| `CommandPalette`, `DropdownMenu`, `Popover`, `ThemePicker` | The `ctrl+p` palette, the actions of a row on `a`, a small panel next to its anchor, and the theme picker. The palette and the picker dim the page; the menu and the popover do not |
| `Search`, `Filters`, `FilterInput`, `TimeRangeControl` | The `/` search, faceted filters on `f`, a text filter field, and a range of time |
| `Disclosure`, `Separator`, `KeyHints` | A section that opens, the one rule, horizontal or vertical, and the footer keys |
| `scramble`, `braille`, `step`, `StepState` | Spinners and the steps of a run, in five states |
| `set_background`, `set_foreground`, `set_progress`, `set_clipboard` | The terminal's colors with OSC 11 and OSC 10, its progress bar with OSC 9;4, and the clipboard with OSC 52 |

The crate is not on crates.io yet. Depend on it and on `kiso-tokens` from
the same git source, so both use one copy of the tokens:

```toml
[dependencies]
tui-kiso = { git = "https://github.com/momoi-labs/blueprint" }
kiso-tokens = { git = "https://github.com/momoi-labs/blueprint" }
ratatui = "0.30"
```

```rust
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::Span;
use ratatui::widgets::Widget;
use tui_kiso::{Columns, Page, Scroll, Theme, Title};

let theme = Theme::new(kiso_tokens::GOLD_DARK);
let scroll = Scroll::default();
let mut page = Page::default();
page.section(&theme, 60, "Machines", Some(1));
let columns = Columns::new(60, &[12, 0]);
page.line(columns.head(&theme, &["Name", "State"]));
page.item([columns.row(vec![vec![Span::raw("pg-main-1")], vec![Span::styled("● Running", theme.success())]])]);

// In your draw, the title on the first row and the page under it.
let mut buf = Buffer::empty(Rect::new(0, 0, 62, 10));
Title::new(&theme, "Overview").render(Rect::new(0, 0, 60, 1), &mut buf);
page.view(&theme, &scroll).selected(Some(0)).render(Rect::new(0, 2, 60, 8), &mut buf);
```

`Theme::new` sends 24-bit color only when `COLORTERM` is `truecolor` or
`24bit`, and maps to the xterm-256 colors otherwise. Widgets leave the
screen unpainted: call `set_background` and `set_foreground` with the
theme's `background` and `foreground` when the view starts, and with `None`
when it quits.

Key handling for forms, filters, the search and the theme picker takes
crossterm key events, behind the `crossterm` feature, on by default.

## Gallery

The gallery shows every component with its variants and states:

```sh
cargo run --manifest-path crates/tui-kiso/Cargo.toml --example gallery
```

`t` opens the theme picker. `s` opens the appearance panel: up and down pick
an option, left and right change it. It sets the backdrop, the card fill,
the border and round ends.

| Flag | What it does |
| --- | --- |
| `--accent <name>` | Starts in another accent |
| `--light` | Starts in the light theme |
| `--256` | Maps colors to the xterm-256 palette |
| `--snapshot <dir>` | Writes every page at 100 by 30, and one at 80 by 24, as HTML without a terminal |
| `--json <file>` | Writes the pages for the Kiso site |

The Kiso site shows the gallery under TUI, from
`apps/kiso-gallery/src/generated/tui-gallery.json`. After a change to a
widget or to the gallery, write it again and commit it; CI fails while it
is out of date:

```sh
cargo run --manifest-path crates/tui-kiso/Cargo.toml --example gallery -- --json apps/kiso-gallery/src/generated/tui-gallery.json
```

## Migrating

Breaking changes since the pg-probe pin (`49350a4`). Each line is the old
call, then the new one.

- `Buttons::new(t, [(label, Press)])` is now
  `FormActions::new(t, [Button::new(t, label).variant(..).state(..)])`.
- `Press::{Plain, Focused, Danger, Off}` is now `ButtonVariant::{Default,
  Primary, Destructive}` plus `ButtonState::{Rest, Focus, Disabled}`. Focus
  moved from the variant to the state, so the primary color no longer means
  focus.
- `Form::press(i, danger)` is now `Form::button_state(i)`, or
  `Form::actions(t, labels, danger)` for the whole row.
- `Buttons::lines(width: usize)` is now `FormActions::lines(width: u16)`.
- `form::Input` is now `form::Control`, with the new variants `Switch`,
  `Radio`, `Combo`, `Chips` and `Area`. `Input` now names the text field
  widget.
- `Field` has a new pub field, `list`. Build a `Field` with its
  constructors, or set `list: None`.
- Enter on a `Select` in a `Form` opens its list. It used to move to the
  next field.
- `Modal` has no line frame. With a fixed `height`, its body has 4 fewer
  rows when it has key hints or buttons, and 2 fewer without them. On an 80
  by 24 screen, a modal with a title and key hints still shows 21 rows of
  body: when its content needs them, it takes the whole height, then drops
  the half rows and the empty row above the footer. Ask for the height the
  content needs (the body plus 6); a height that fits keeps the margin.
- `Tabs::line(width)` is now the labels only. The rule under them is
  `Tabs::rule(width)`, on a second row. A caller that draws only `line`
  compiles and loses the rule. `Tabs::height()` is the rows both take.
- A code block of `Page` has the surface of a `Card`: the fill and the
  rail follow the `Look`. With `Border::Rail`, the rail takes the second
  column of the page.
- `Table` has a header fill, a 2-cell column gap and its own scrollbar.
- `fact` cuts a key longer than its column with `…`.
- `ThemePicker` sits on an Elevated card and dims the page.
- `Menu` and `Palette` are aliases of `DropdownMenu` and `CommandPalette`.
  The old names still compile.
- `AppShell` takes `.margin(columns)`. The default is still 2. With 1, the
  rail of a card at the edge of the page takes the first column.
- A `Card` and each row a `Page` draws now take the pattern of the
  `Backdrop` out of their cells, and reset the text color there. Remove a
  local clear for those. They also clear a mark of the pattern in the cell
  before and after. For a region with no card, call
  `Backdrop::clear(area, buf)` before you draw it; for a footer, clear the
  whole row of the screen.
- A line cut with `…` no longer keeps a space before the ellipsis.
- For the title of a card or a pane, use `Card::title(buf, area, title,
  meta)` or `Page::heading(theme, width, title, meta)`: bold title, muted
  meta, cut with `…`. `Page::section` stays the title of a page section.
