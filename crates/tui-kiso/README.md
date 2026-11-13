# tui-kiso

Kiso components for [ratatui](https://ratatui.rs) terminal interfaces. Kiso
is the Momoi Labs design system. See it at
[kiso.momoi-labs.dev](https://kiso.momoi-labs.dev).

The look follows Charm's Crush: no frames around parts of a page, a section
is a title and a rule, and only the selection, code, cards, badges, buttons
and dialogs get a fill or a frame. Your app keeps its own event loop and layout. The
widgets follow the
[terminal interfaces](https://github.com/momoi-labs/blueprint/blob/main/kiso/docs/terminal-interfaces.md)
contract, and each component doc has a Terminal section.

| Part | What it is |
| --- | --- |
| `Theme`, `Accent`, `Look` | The tokens of one accent, dark or light, at the terminal's color depth, and the look: the patterns of the title line and section rules, the card fill and border, and round ends |
| `Title`, `Tabs`, `Header` | Where the person is: the page title, the views of a screen, the brand and breadcrumb |
| `Page`, `Scroll`, `Columns` | A page of rows that scrolls, with sections, items to select, columns and code blocks |
| `Sidebar` | The navigation, as wide as its longest line, on the left or the right |
| `Table`, `Pagination`, `StatusBadge` | Records in columns with a header fill, a selection, and empty, loading and paged states; the pages of a list; the state of a record |
| `KV`, `FilterInput`, `LogView`, `CodeBlock` | The facts of a record, the field that filters a list, log lines that follow the end, and code on a card surface |
| `Chart`, `Series`, `ChartLegend`, `Sparkline` | Series over time in braille with a scale and a legend, and the trend of one series in a cell |
| `Meter`, `BarGauge` | A measurement against its limit on one row, and labelled measurements on one scale |
| `KeyHints`, `Search`, `Palette` | The footer keys, the `/` search and the `ctrl+p` command palette |
| `Filters`, `Menu`, `fact` | Faceted filters on `f`, the actions of a row on `a`, the facts of a record |
| `Modal`, `Question`, `ThemePicker` | Dialogs: help or your own content, a question with buttons, the theme picker |
| `Form`, `Field`, `FormActions` | Forms with labels in a column, and the buttons that end them, primary last |
| `Checkbox`, `RadioGroup`, `Select`, `Combobox`, `ChipInput` | A choice on or off, one of a few, one from a list, one from a filtered list, and short values as chips |
| `Card`, `Stat` | A surface of fill for related content, and one number with its label and delta |
| `Badge`, `Dot`, `Tone` | A label or a mark in one of five tones |
| `Button`, `Switch` | An action with a variant and a state, and a setting that is on or off |
| `Grid`, `Backdrop` | The areas of a page on tracks of 13 columns, and the canvas behind it |
| `Toast`, `scramble`, `braille`, `step`, `StepState` | Notices, spinners and the steps of a run, in five states |
| `Alert`, `Spinner`, `Skeleton`, `EmptyState` | A tinted message per tone, a braille spinner with a label, loading blocks, and a region with nothing in it |
| `Link`, `Separator` | An underlined destination with a focus state, and the one rule, horizontal or vertical |
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

`t` opens the theme picker. `s` opens the appearance panel: up and down
pick an option, left and right change it.

Add `--accent <name>`, `--light` or `--256` to try another theme, or
`--snapshot <dir>` to write every page at 100 by 30, and one at 80 by 24,
as HTML without a terminal.

The Kiso site shows the gallery under TUI, from
`apps/kiso-gallery/src/generated/tui-gallery.json`. After a change to a
widget or to the gallery, write it again and commit it; CI fails while it
is out of date:

```sh
cargo run --manifest-path crates/tui-kiso/Cargo.toml --example gallery -- --json apps/kiso-gallery/src/generated/tui-gallery.json
```
