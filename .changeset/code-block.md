---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
"kiso-tokens": minor
---

Add CodeBlock for read-only code, and syntax roles for highlighted code.

- CodeBlock shows commands, values, configuration and line diffs in a panel, with an optional title, terminal mark and labelled Copy. Copy confirms with a Toast and falls back to a selection copy on plain HTTP.
- `lineNumbers`, `added`, `removed`, `diff` and `collapse` add numbers, `+` and `−` markers with "Added line" and "Removed line" labels, and folded ranges.
- `highlight` has CodeEditor's signature, so one highlighter paints examples and editors. Tokens may span lines.
- Five syntax roles, `--color-code-comment`, `--color-code-keyword`, `--color-code-string`, `--color-code-constant` and `--color-code-name`, alias gated text roles. The AA gate checks them, and `.code-*` classes apply them. Data interfaces now allow highlighting with these roles only.
