# tui-kiso

## 0.4.0

### Minor Changes

- d96f5d4: The terminal Alert has the diagnostic slots of the web Alert. `label` puts the severity and a short name on the glyph row, and `code` adds a chip after it. With a label, the title is the message on the next row. `help` prints `help:` in bold, and the action sits after it when it fits. Under a rule, `facts` lists `source:` and `since:`, `lines` takes `AlertLine` evidence in aligned columns, and `note` prints `note:` in bold. A primary `AlertLine` is bold with `◂` before its label, so it does not depend on color. Every slot wraps, and `height` counts each row, in the tinted card and in `loud`. The gallery has a LoudAlert page with the simple, detailed and full levels for each severity.
- 12bd915: `Alert::area` returns the bar an alert takes on the screen at an `AlertSide`: `Top`, `Middle` or `Bottom`, at the full width and the alert's height. Draw the alert after the content, and it covers it without taking the content's bold or italic. A loud error or warning puts its tape in the top edge of the card. Every loud alert has a blank row under that edge and under the title block, so all tones have the same height. Across the whole screen, the tape row and the bottom row are full cells, so a terminal that extends its padding color shows no notch. A loud error shows an inverted `!`, and the loud action is a filled button in the text color. The gallery LoudAlert page has a position control, so the bar spans the whole terminal at the top, middle or bottom.

## 0.3.0

### Minor Changes

- 5d1ff86: Add the `snes` accent, dark and light, so every Kiso accent has a terminal theme.

## 0.2.0

### Minor Changes

- be1865d: `Alert::loud` draws the loud form: the card filled with the tone's solid color, text in its solid foreground and one `▚` tape row on top. It does not animate.
