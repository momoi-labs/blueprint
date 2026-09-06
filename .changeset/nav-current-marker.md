---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": patch
---

Mark the current navigation destination beside the item instead of on it.

`--color-selected` and `--color-accent-surface-hover` are the same value, so a
filled current item and a hovered sibling painted the same surface and the 2px
rail was left carrying the whole distinction. The fill now belongs to hover
alone, and the marker moves into the sidebar's gutter, where it finally has the
shared edge a rail needs.

`.nav-row` lays navigation out in a row and moves that marker to the bottom
edge, so a horizontal nav stops wearing a sidebar's left rail.

The React layer stopped forcing a column on every navigation list, so the row
treatment is not overridden from the package that consumes it.
