# kiso-core

Kiso component specs. Kiso is the Momoi Labs design system. See it at
[kiso.momoi-labs.dev](https://kiso.momoi-labs.dev).

Each component is one struct with its props, variants and defaults. The
struct is the source for every output: the TypeScript types of
`@momoi-labs/kiso-react`, the [`tui-kiso`](https://crates.io/crates/tui-kiso)
widgets for ratatui, and the HTML and text renderers in this crate.

```rust
use kiso_core::{StatusBadge, StatusTone};

let badge = StatusBadge::new(StatusTone::Success, "Running");
assert_eq!(badge.to_text(), "● Running");
```

## License

MIT
