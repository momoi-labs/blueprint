# Terminal interfaces

These rules govern Kiso products drawn in a terminal: live views, monitors
and progress screens built with a TUI library such as ratatui. A terminal
cannot load `ui.css` or the token CSS, so this file says how the web
contracts carry over. A product-specific exception must be recorded in the
product's `docs/kiso.md`.

The evidence is pg-probe (its `top` live view and its capture progress
screen) and the `tui-kiso` gallery, which draws every terminal component.

Rust products draw with the `tui-kiso` crate, built on ratatui and
`kiso-tokens`. Each component's doc has a Terminal section with its
terminal form.

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
  own reads as `foreground`. A terminal's own
  background, often light, breaks the dark values' contrast. This is why
  `*-on-dark` roles exist (see [tokens](tokens.md)). A product that must
  run where OSC 11 does not work paints `background` on every cell
  instead.
- Use one accent, the one the product's web UI uses, and record it in
  `docs/kiso.md`. In Rust that is one constant, such as
  `kiso_tokens::GOLD_DARK`.
- Status text uses `success-on-dark`, `warning-on-dark`, `danger-on-dark`
  and `info-on-dark`.
  Categorical series use `chart-1` to `chart-5` in order.
- Send 24-bit color only when `COLORTERM` is `truecolor` or `24bit`. Other
  terminals, such as tmux on many servers, read RGB codes as other
  attributes. Map each color to the nearest of the 256 xterm colors instead.
- In 256 colors, `selected` keeps the accent's hue. Keep only the cube
  colors within 25 degrees of its hue that differ from `background`, then
  pick the nearest of those. Do not pick by distance alone: for the gold
  accent, the nearest color is a grey, and the nearest cube color a dark
  red.
- Never fall back to the 16 named ANSI colors. The user's terminal theme
  redefines them.

In `tui-kiso`, `Theme::new(kiso_tokens::GOLD_DARK)` applies these rules: it
reads `COLORTERM`, maps colors and picks `selected`. `Theme::truecolor` and
`Theme::xterm_256` fix the color depth, for tests and snapshots. The theme
gives a ratatui style per role, such as `base`, `muted`, `selected` and
`danger`. `Accent::tokens` gives the tokens of a dark or light theme, and
`set_background` and `set_foreground` send OSC 11 and OSC 10.

## Surfaces

A page has no frames around its parts. A section is a title and a rule.
Only the selection, code, buttons, notices and dialogs get a fill or a
frame.

| Element | Style |
| --- | --- |
| Screen | Unpainted: the terminal's background, set to `background` |
| Brand | Product name and version, bold `primary-foreground` on `primary`, in the header or at the top of the sidebar |
| Page title | The title in bold `foreground` in the middle of the title line across the page: a heavy `━` in `primary` |
| Section | The title in `muted-foreground`, then the section rule to the edge: a thin `─` in `border`. A count can end the rule |
| Column titles | `subtle-foreground`, no fill |
| Selected row | A `primary` `▌` in the first column and the `selected` background. Text keeps its role colors |
| Focused row of a plain list, such as the command palette | `primary-foreground` on `primary` |
| Code block | `card` fill, with half a row of fill above and below |
| Button | Two columns of padding and half a row of fill above and below. Focused: bold `primary-foreground` on `primary`, or on `danger` for a destructive action. Not focused: `foreground` on `muted` |
| Dialog | A rounded `primary` frame on `background`, the title in bold `primary` in the top border and the dialog's keys in the bottom one. No shadow and no dimmed page |
| Toast | A bold label and the message on `success-on-dark`, across the footer row |
| Secondary text | `muted-foreground` |
| Tree branches, rules and other non-text marks | `subtle-foreground` or `border` |
| Key hint | Key in `foreground`, label in `muted-foreground`, a `•` in `border` between hints. The current view's label is bold `foreground` |

- The brand leads with the product name and version, so a screenshot says
  which tool and release produced it.
- The title line and the section rule are product options. `tui-kiso`
  `Theme::with_look` picks the pattern, such as `━`, `─`, `░` or `╱`, and
  the ink: `primary`, the `primary` to `chart-1` gradient, or `border`. The
  table above gives the defaults.
- A selected row changes only its background and gets the `▌`. Status
  marks and words keep their colors, so a failed row stays red when
  selected.
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
  and its `○` and word still name it. Check the ratio after the
  256-color mapping, against the colors the terminal draws.
- A full-screen view is a page. Draw it with the same header or sidebar,
  section rules and footer as the main view. A dialog is for content that
  sits over a page and closes back to it: help, a question, a picker, the
  command palette or a short form.

## Layout

- Design for an 80 by 24 terminal at minimum. The help screen and every
  dialog fit in 24 lines. Use a second column when a list does not fit.
- Every row counts: the page starts on the first row and the key hints
  take the last one. Keep two columns free at each side.
- Put the navigation in a sidebar on the left, or on the right as a
  product option. It is as wide as its longest line, from 20 to 32
  columns, and sits four columns from the page. Hide it when the page
  would get fewer than 60 columns.
- A page longer than the screen scrolls, and the selection stays on
  screen. The scrollbar has no arrows: a `│` track in `border` and a thumb
  in `primary`, in the second column right of the page. The mouse wheel
  scrolls too.
- In a form, the label sits in a column on the left and the value on the
  same row, as in a list. Focus is the selected row, and the field's hint
  or error goes on the row under it. A short form, up to four fields, is a
  dialog. A form that creates something is a page. Editing one section of
  a detail page happens in place.
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
- The actions of a row open in a small menu right under it, or above it
  near the bottom of the screen: the terminal form of a `⋯` menu. A
  destructive action is in `danger-on-dark`, and selected it takes the
  `danger` fill.
- Give spare width to the widest value, such as query text. A compact mode
  may merge columns (`user@database`) or shorten values (`act`, `txn`).
- Spell out every abbreviation on the help screen, not on the main screen.
- Drop a column that cannot hold data in the current context, such as a
  field the server version does not provide. Do not show a column of unknown
  values.

## Keys

- `?` opens help: a dialog over the current layer that lists every key,
  grouped by where it works. Any key closes it. `F1` opens it too, so help
  stays reachable while a text input has focus.
- `q` and `Esc` close the top layer, one layer at a time. `q` quits only
  from the main view. `Esc` never quits. In a text field `q` is text, so
  only `Esc` closes. A record's details are a layer: `q` and `Esc` go back
  to the list.
- Keys go to the top layer only, in this order: a dialog or menu, a form,
  the search while typing, a record's details, then the page. On a list
  page, `Esc` clears the search first, then the filters, then moves focus
  to the sidebar.
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
- The footer shows the keys of the current layer in priority order. `?`
  (`F1` while typing) and `q` or `Esc` come last and always stay. When the
  width runs out, drop the lowest-priority hints, from the right. A dialog
  puts its own keys in its bottom border.
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

## Accessibility

- Do not mix the terminal's default colors with Kiso colors on the same
  screen. Kiso's contrast checks hold only on Kiso's surfaces.
- Color never carries meaning alone. A state or status also has text, such
  as a word or an abbreviation explained on the help screen.
- The view stays usable with keys only. Mouse support is optional.

## Verify

1. Run the view in a truecolor terminal with a light theme. The terminal's
   background and text color turn to Kiso's when the view starts and come
   back when it quits.
2. Run it with 256 colors, for example `COLORTERM= TERM=screen-256color`
   inside tmux. The selected row stays visible.
3. Resize to 80 by 24. The main view, the help screen and every dialog
   fit, and the sidebar hides.
4. If the view can run off a terminal, pipe its output, for example
   `| cat`. It appends lines and does not redraw.
5. Walk every layer with `q` and `Esc`. Each closes one layer, and only `q`
   on the main view quits.
6. Compare with the gallery:
   `cargo run --manifest-path crates/tui-kiso/Cargo.toml --example gallery`.
   Add `--accent <name>` or `--light` to try another theme, or
   `--snapshot <dir>` to write every page at 100 by 30, and one at 80 by
   24, as HTML without a terminal.

Some SSH sessions drop `COLORTERM`, so a truecolor terminal can get the
256-color fallback over SSH. That is expected and safe.
