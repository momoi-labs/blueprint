---
"@momoi-labs/kiso-react": minor
---

Add the console layout patterns that existed only in `ui.css`: AppShell,
Split / Pane / Splitter, LogView, Stat, KV, Dot and Separator.

Splitter owns the pane size and is a real `separator`, so the divider can be
moved with the arrow keys and not only dragged. LogView owns its scroller and
follows the tail, so consumers do not each rebuild that. Dot spells status as a
`variant` prop, the way Badge already does, rather than as utility classes.
