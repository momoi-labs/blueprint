# tui-kiso

Kiso components for [ratatui](https://ratatui.rs) terminal interfaces. Kiso
is the Momoi Labs design system. See it at
[kiso.momoi-labs.dev](https://kiso.momoi-labs.dev).

The crate is a thin layer: a `Theme` built from one `kiso-tokens` accent,
and the widgets `Header`, `KeyHints`, `Table`, `StatusBadge` and `Modal`.
Your app keeps its own event loop and layout. The widgets follow the
[terminal interfaces](https://github.com/momoi-labs/blueprint/blob/main/kiso/docs/terminal-interfaces.md)
contract, and each component doc has a Terminal section.

The crate is not on crates.io yet. Depend on it from git:

```toml
[dependencies]
tui-kiso = { git = "https://github.com/momoi-labs/blueprint" }
kiso-tokens = "0.1"
ratatui = "0.30"
```

```rust
use tui_kiso::{StatusBadge, Table, Theme};
use ratatui::layout::Constraint;

let theme = Theme::new(kiso_tokens::GOLD_DARK);
let rows = [[ratatui::text::Line::raw("pg-main-1"), StatusBadge::success(&theme, "Running").into()]];
let table = Table::new(&theme, rows, [Constraint::Length(12), Constraint::Fill(1)])
    .header(["Name", "State"]);
```

`Theme::new` sends 24-bit color only when `COLORTERM` is `truecolor` or
`24bit`, and maps to the xterm-256 colors otherwise.

## Gallery

The gallery shows every component with its variants and states:

```sh
cargo run --manifest-path crates/tui-kiso/Cargo.toml --example gallery
```

Add `--accent <name>` to try another accent, or `--snapshot <dir>` to write
every page at 80 by 24 as HTML without a terminal.
