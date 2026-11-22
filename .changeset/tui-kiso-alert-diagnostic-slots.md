---
"tui-kiso": minor
---

The terminal Alert has the diagnostic slots of the web Alert. `label` puts the severity and a short name on the glyph row, and `code` adds a chip after it. With a label, the title is the message on the next row. `help` prints `help:` in bold, and the action sits after it when it fits. Under a rule, `facts` lists `source:` and `since:`, `lines` takes `AlertLine` evidence in aligned columns, and `note` prints `note:` in bold. A primary `AlertLine` is bold with `◂` before its label, so it does not depend on color. Every slot wraps, and `height` counts each row, in the tinted card and in `loud`. The gallery has a LoudAlert page with the simple, detailed and full levels for each severity.
