# kiso-tokens

## 0.3.0

### Minor Changes

- c15c54b: Add CodeBlock for read-only code, and syntax roles for highlighted code.
  
  - CodeBlock shows commands, values, configuration and line diffs in a panel, with an optional title, terminal mark and labelled Copy. Copy confirms with a Toast and falls back to a selection copy on plain HTTP.
  - `lineNumbers`, `added`, `removed`, `diff` and `collapse` add numbers, `+` and `−` markers with "Added line" and "Removed line" labels, and folded ranges.
  - `highlight` has CodeEditor's signature, so one highlighter paints examples and editors. Tokens may span lines.
  - Five syntax roles, `--color-code-comment`, `--color-code-keyword`, `--color-code-string`, `--color-code-constant` and `--color-code-name`, alias gated text roles. The AA gate checks them, and `.code-*` classes apply them. Data interfaces now allow highlighting with these roles only.

## 0.2.0

### Minor Changes

- 4bc8010: Add `success-on-dark`, so a terminal or log view can show success in the same
  dark-surface family as warning, danger and info. The terminal contract now
  picks the 256-color selected row by the accent's hue first, because the
  nearest color by distance turns gold into dark red.

## 0.1.1

### Patch Changes

- f38f222: Link the crate to kiso.momoi-labs.dev and the terminal interfaces contract.
