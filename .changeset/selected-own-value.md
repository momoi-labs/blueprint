---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": patch
---

Give `--color-selected` a value of its own, one ramp step past
`--color-accent-surface-hover` (`accent.300` light, `accent.800` dark).

The two tokens held the same value in both themes, so anything that can be
hovered and selected at once painted one surface for both. In the command
palette that is a defect: arrow down to the third command with the pointer over
the first and both look highlighted, while only the keyboard one will run.

Selection now reads as more committed than a hover, which is what a consumer
reaching for the token expects. `selected-foreground` still clears 4.5:1 on the
new fill in both themes.
