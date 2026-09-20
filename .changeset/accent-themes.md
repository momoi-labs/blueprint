---
"@momoi-labs/kiso": minor
---

Add accent themes. `tokens/tokens.json` gains the `terracotta`, `teal`, and
`cobalt` primitive ramps beside the renamed `violet` ramp, and an `accent.*`
group that the build emits as one `[data-accent="<name>"]` block each. A block
remaps the active `--color-accent-*` ramp and restates the dark fills; the
neutrals stay the same under every hue accent. `nocturne` is the marketing
site's cool slate palette under the violet ink and is the one accent that
restates the neutral roles; theme and accent compose
through `light-dark()`. `chart-1` is pinned to the violet ink so chart series
stay apart from the status series under every accent. The contrast and chart
palette gates now run once per accent. New contract:
`docs/components/accent-selector.md`.
