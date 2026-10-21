---
"@momoi-labs/kiso": minor
"kiso-tokens": minor
---

Add `success-on-dark`, so a terminal or log view can show success in the same
dark-surface family as warning, danger and info. The terminal contract now
picks the 256-color selected row by the accent's hue first, because the
nearest color by distance turns gold into dark red.
