# Terminal interfaces

These rules govern Kiso products drawn in a terminal: live views, monitors
and progress screens built with a TUI library such as ratatui. A terminal
cannot load `ui.css` or the token CSS, so this file says how the web
contracts carry over. A product-specific exception must be recorded in the
product's `docs/kiso.md`.

The evidence is pg-probe: its `top` live view and its capture progress
screen.

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
- Use the dark theme in both OS themes, and paint `background` on every
  cell. A terminal's own background, often light, breaks the dark values'
  contrast. This is why `*-on-dark` roles exist (see
  [tokens](tokens.md)).
- Use one accent, the one the product's web UI uses, and record it in
  `docs/kiso.md`. In Rust that is one constant, such as
  `kiso_tokens::GOLD_DARK`.
- Status text uses `warning-on-dark`, `danger-on-dark` and `info-on-dark`.
  Categorical series use `chart-1` to `chart-5` in order.
- Send 24-bit color only when `COLORTERM` is `truecolor` or `24bit`. Other
  terminals, such as tmux on many servers, read RGB codes as other
  attributes. Map each color to the nearest of the 256 xterm colors instead.
- After the 256-color mapping, check that `selected` still differs from
  `background`. If it does not, pick the nearest index in the accent's hue
  that does.
- Never fall back to the 16 named ANSI colors. The user's terminal theme
  redefines them.

## Surfaces

| Element | Style |
| --- | --- |
| Screen | `foreground` on `background` |
| Brand in the header | Product name and version, bold `primary-foreground` on `primary` |
| Table header row and section bar | Bold `foreground` on `muted` |
| Selected row | `selected-foreground` on `selected` |
| Inline panel, such as a preview under a list | `surface` fill, `border` frame |
| Popup over a page | `elevated-surface` fill, `border` frame |
| Panel and popup title | `foreground`, never the frame color |
| Secondary text | `muted-foreground` |
| Tree branches, rules and other non-text marks | `subtle-foreground` |
| Key hint | Key in `link`, label in `muted-foreground`. The current view's label is bold `foreground` |

- The header leads with the product name and version, so a screenshot says
  which tool and release produced it.
- A full-screen view is a page. Draw it on `background`, with the same
  header, section bars and footer as the main view. A popup is for content
  that sits over a page and closes back to it.

## Layout

- Design for an 80 by 24 terminal at minimum. The help screen and every
  popup fit in 24 lines. Use a second column when a list does not fit.
- Give spare width to the widest value, such as query text. A compact mode
  may merge columns (`user@database`) or shorten values (`act`, `txn`).
- Spell out every abbreviation on the help screen, not on the main screen.
- Drop a column that cannot hold data in the current context, such as a
  field the server version does not provide. Do not show a column of unknown
  values.

## Keys

- `?` opens a help screen that lists every key, grouped by where it works.
  Any key closes it.
- `q` and `Esc` close the top layer, one layer at a time. `q` quits only
  from the main view. `Esc` never quits. `Ctrl+C` quits from anywhere.
- The footer shows the main keys of the current layer, and always `?`.
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

1. Run the view in a truecolor terminal with a light theme. Every cell has
   the Kiso background.
2. Run it with 256 colors, for example `COLORTERM= TERM=screen-256color`
   inside tmux. The selected row stays visible.
3. Resize to 80 by 24. The main view, the help screen and every popup fit.
4. If the view can run off a terminal, pipe its output, for example
   `| cat`. It appends lines and does not redraw.
5. Walk every layer with `q` and `Esc`. Each closes one layer, and only `q`
   on the main view quits.
