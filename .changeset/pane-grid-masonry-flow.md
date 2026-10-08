---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Add `flow="masonry"` to PaneGrid. Panes keep their natural heights and take
the shortest free column space in their row, so short cards no longer leave
gaps below them. Rows stay separate groups. Masonry ignores `fill`, and
`overflow="scroll"` keeps the rows flow.
