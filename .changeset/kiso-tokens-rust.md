---
"@momoi-labs/kiso": minor
---

Add the terminal-interfaces contract, which says how Kiso's rules carry over
to terminal UIs: colors, surfaces, layout, keys, saved state and checks. The
token build also generates the `kiso-tokens` Rust crate, with every accent and
mode as sRGB, so a terminal UI no longer copies hex values by hand.
