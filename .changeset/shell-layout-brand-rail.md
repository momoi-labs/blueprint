---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Make the shell layout's brand placement available in the packages.
ApplicationShell takes `brandMark`, which keeps the brand's mark in the
collapsed rail as the expand control, and `shellLayout`, which gives the Header
and the sidebar header one bar height, starts the brand at the brand inset,
moves the primary action below the bar, and puts the brand in a floating
Header. The CSS adds `.sidebar-rail-mark`, `.sidebar-rail-open`,
`.sidebar-actions`, `--app-shell-brand-inset` and `--app-shell-bar-height`.
