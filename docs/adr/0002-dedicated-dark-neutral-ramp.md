---
status: accepted
date: 2026-09-10
supersedes: []
superseded_by: null
tags: [kiso, tokens, dark-theme]
---

# Dedicated warm dark neutral ramp and the accent ink/fill split

One neutral ramp served both themes, but its two halves disagreed: the light steps were warm (`#fffefc`, hue ~80°) while the dark steps were cold and purple-leaning (`#131217` to `#312f37`, hue ~290°), so the dark theme read as a different product. Layering was also glued together, with the sidebar sitting only ~3.5 luminance points under the background, and a single accent token served as both ink and fill, which left `.btn-primary` with near-black text on a washed lilac inside a dark UI. We decided to add a dedicated dark-theme ramp `color.dark.50-950` in the light ramp's warm hue with clear layer spacing, and to split the accent into two roles: a text-eligible light ink (`accent.base`, flowing into `link` and `focus`) and a deep violet fill (`primary`, `primary-hover`, `primary-foreground`, the accent surfaces and `selected`, with dedicated dark literals). No token is removed or retyped; only the dark arguments of the existing `light-dark()` pairs change, plus the new tokens.

## Considered options

- **Rewrite `neutral.700-950` in the warm hue.** Rejected: the light theme's contract would churn and the ramp would silently change meaning under existing consumers. A dedicated `dark.*` ramp leaves `neutral.*` untouched and makes each theme's surface set explicit.
- **Keep one accent token for ink and fill.** Rejected: the roles diverge on dark. The ink must stay text-eligible (5.5:1 on `dark.800`), the fill must carry near-white text (6:1), and no single value does both.
- **Point `border-strong` and `subtle-foreground` at `dark.500`.** Rejected by the AA gate: `dark.500` measures 2.6:1 on `dark.800` and 2.1:1 on `dark.700`, below the 3:1 non-text requirement. Both roles sit on the half step `dark.450` instead, sharing one step on dark exactly as they share `neutral.500` on light.
- **Use the proposed danger dark step `#f47a79`.** Rejected by the AA gate: 4.4:1 on `elevated-surface`, under the 4.5:1 text requirement. The status moves to `#f5807f` (4.6:1 worst case), and the danger tint/border alphas recalculate with it.

## Consequences

- The dark theme's surfaces, text, borders, and status colors all consume `color.dark.*` or recalibrated literals; the neutral ramp's dark tail and `accent.900/950` remain in the file but are no longer referenced by the semantic layer.
- `primary` is no longer text-eligible on dark, so the contrast gate checks `link` (the ink) instead of `primary` as a text role, and the `.nav-item` active rail draws with `--color-link` rather than `--color-primary` to keep its 3:1 against the sidebar.
- Status dark steps are recalibrated (`success #5bd295`, `warning #efc05b`, `danger #f5807f`, `info #75c4fa`); the theme-invariant `*-on-dark` roles and the rgba status tints and borders move with them.
- Nothing is removed, so this is a minor release: every existing custom property keeps its name, and the new `--color-dark-*` steps are additions.
