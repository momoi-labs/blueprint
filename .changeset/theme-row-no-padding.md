---
"@momoi-labs/kiso-react": patch
---

ThemeSelector and AccentSelector rows no longer add their own 8px padding.
In a header the row made the bar taller than `--header-min-height`. The host
now sets the inset; a sidebar footer keeps the inline inset of its nav items.
