---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

dedicated warm dark ramp ("Sumi") and accent ink/fill split

The dark theme no longer borrows the cold, purple-leaning tail of the light
neutral ramp. It draws surfaces from a dedicated `color.dark.50-950` ramp in
the light ramp's warm hue, with enough layer spacing for the sidebar to sink
below the canvas and cards to lift above it.

The accent splits into two roles: a text-eligible light ink
(`--color-accent-base`, consumed by `--color-link` and `--color-focus`) and a
deep violet fill (`--color-primary` and its hover and surface tints) that
keeps near-white text. Status dark steps and their tint/border alphas are
recalibrated, and `--color-primary` is no longer text-eligible on dark, so
ink-level affordances (links, focus rings, the nav rail) draw with the ink
instead.

No custom property is removed or renamed, so existing consumers keep working;
the new `--color-dark-*` steps are additive.
