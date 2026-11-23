---
"tui-kiso": minor
---

`Alert::area` returns the bar an alert takes on the screen at an `AlertSide`: `Top`, `Middle` or `Bottom`, at the full width and the alert's height. Draw the alert after the content, and it covers it without taking the content's bold or italic. A loud error or warning puts its tape in the top edge of the card. Every loud alert has a blank row under that edge and under the title block, so all tones have the same height. Across the whole screen, the tape row and the bottom row are full cells, so a terminal that extends its padding color shows no notch. A loud error shows an inverted `!`, and the loud action is a filled button in the text color. The gallery LoudAlert page has a position control, so the bar spans the whole terminal at the top, middle or bottom.
