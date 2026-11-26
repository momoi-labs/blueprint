---
"@momoi-labs/kiso": patch
---

Keep `.app-shell::before` pinned to the viewport height with sticky positioning so canvas backgrounds (`glow`, `enso`, `momoi`, and repeating patterns) remain visible at narrow widths (`< 1024px`) and on tall scrolling pages across default and inset shells without inflating or leaking out of nested `.app-shell[data-background-canvas]` previews.
