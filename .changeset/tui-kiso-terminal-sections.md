---
"@momoi-labs/kiso": minor
---

The terminal contract now points Rust products at the `tui-kiso` crate and
settles its open questions: a selected row changes only its background and
falls back to `foreground` where a role misses contrast on `selected`, help
is a popup, `Ctrl+C` asks before it stops a running job, `:` opens the
command palette, and the footer drops hints from the right. Header, Table,
StatusBadge, Modal and the keyboard shortcuts pattern gain a Terminal
section.
