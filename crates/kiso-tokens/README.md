# kiso-tokens

Kiso's semantic colors as sRGB, for terminal and native UIs that cannot load
Kiso's CSS. Each accent has a light and a dark theme.

```rust
use kiso_tokens::GOLD_DARK as THEME;

let [r, g, b] = THEME.foreground;
```

With ratatui, build a color with `Color::Rgb(r, g, b)`.

`src/tokens.rs` is generated from `tokens/tokens.json`. Do not edit it. Run
`npm run build` at the repository root to regenerate it.

Roles with alpha, such as `overlay` and the status surfaces, are left out,
because a terminal cell cannot blend colors.
