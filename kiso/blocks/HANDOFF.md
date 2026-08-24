# Handoff — Kiso v1.1 token and contract changes

Target repo: `momoi-labs/blueprint`. Reference implementation:
`kiso/blocks/` (branch `kiso/blocks-scaffold`).

Per `kiso/AGENTS.md`, adding or changing a token, a component contract, or a
pattern contract is **not** a decision a consuming product may make alone —
hence this proposal rather than a local fork.

## Scope: no colour values change

No hex in `color.neutral.*`, `color.accent.*`, or `color.status.*` is edited.
Everything here is sizing, structure, and two role changes.

## Evidence

self-host was the first product on Kiso v1 (`f7d88ea`). Three gaps surfaced
that a consuming product cannot fix on its own:

1. **No control-size token.** `spacing`, `radius`, and `type.size` exist;
   nothing states how tall a button or input is. The console filled the gap
   with `min-height: 44px` — the WCAG touch target — applied unconditionally
   including on desktop. With `type.size.body` at 16px, every screen read
   oversized. Largest single cause of the complaint.
2. **The semantic layer is too small.** With 15 slots, `.button` had to hover
   onto `elevated-surface`, and `.button-primary` could not be a solid fill
   because there is no `primary-foreground`. So the primary action shipped as
   a violet outline — which is why a violet design system rendered as grey.
3. **The ramps have no endpoints.** Light needs a page background *beneath* a
   white card; `neutral.100` is already the lightest. Dark needs a violet dark
   enough to fill a selected row; `accent.900` is too saturated.

## Token changes — `tokens/tokens.json`

### 1. Ramp extensions (additive only)

| Token | Value | Why |
| --- | --- | --- |
| `color.neutral.50` | `#fffefc` | warm white above `neutral.100`, light sidebar |
| `color.neutral.950` | `#131217` | below `neutral.900`, dark sidebar and log surface |
| `color.accent.50` | `#f7f4ff` | lightest violet wash |
| `color.accent.500` | `#a690ea` | fills the gap between `400` and `600` |
| `color.accent.950` | `#211741` | dark selected-row surface |

`color.accent.base` stays and stays theme-swapped (`#cbbdf7` dark /
`#5b3fc4` light).

### 2. NEW `size.*` group

```
size.control.xs    24px
size.control.sm    32px
size.control.md    36px   ← default for button, input, select
size.control.lg    40px
size.touch.min     44px   ← @media (pointer: coarse) ONLY
size.icon.sm/md/lg 14 / 16 / 20px
size.sidebar      248px
size.content.max 1280px
```

`docs/accessibility.md` must state that 44px is a coarse-pointer rule and not
a layout rule — the current wording is what led the console to apply it on
desktop.

### 3. Type scale — base 16px → 14px (breaking)

| Role | v1 | v1.1 |
| --- | --- | --- |
| metadata | 11 | 11 |
| label | 13 | **12** |
| body | 16 | **14** |
| h3 | 19 | **16** |
| h2 | 23 | **18** |
| h1 | 28 | **22** |
| display | 33 | **30** |

Letter-spacing moves `rem` → `em`: `display -0.02em`, `heading -0.015em`,
`normal 0em`, `label 0em`, new `caps 0.06em`. Line-height `tight` 1.2 → 1.25,
new `snug` 1.35.

### 4. Radius — two steps tighter, and two tokens removed

`sm` 4 → 3, `md` 8 → **4** (controls), `lg` 12 → 5, new `xs` 2 (checkbox),
`full` unchanged. **`xl` and `2xl` are not added** — they existed only to
serve a rounded panel mode that this proposal does not ship.

### 5. NEW corner treatment

```
radius.surface     0px
corner.mark        1        (opacity; 0 removes them)
corner.mark.tick   4px
corner.mark.gap    2px
color.corner-mark  → semantic.border-strong
```

Panels — card, dialog, table frame, code block, log view — read
`radius.surface` instead of a radius token directly, so the system can change
corner language without touching a component.

Kiso states a panel corner with a **registration mark, not a curve**: two 1px
ticks per corner, each lying along the frame line it extends and stopping
`gap` short of it. Two ticks and not four — a full cross puts its other two
arms on top of the panel border where they are invisible.

Implementation is eight 1px gradient bars on one pseudo-element inset by
`tick + gap`. No markup, no images.

This is the proposal's one piece of visual invention, and it is deliberate: a
design system named *Blueprint* stating its corners the way a drawing states a
trim line. `docs/brand.md` asks for practical, technical, precise, and
understated, and rules out decoration that does not help — a registration mark
is the opposite of decoration, it is how the frame is specified.

**Every panel carries marks.** Exceptions for repeated tiles and for nested
panels were built and compared side by side; both cost a rule in the contract
and bought little. Alternatives where the marks bridge the gutter, or where
continuous guides belong to the sheet and panels occlude them, were also
built — the second is a layout pattern rather than a component concern and is
not part of this proposal.

### 6. NEW hatch

```
hatch.line     5px
hatch.period  10px
hatch.angle   45deg
color.hatch   → neutral.200 (light) / neutral.800 (dark)
```

A semantic, not a decoration: hatching means **this region is not data**.
Three sanctioned uses — empty state, chrome band, unavailable pane — and an
explicit prohibition on everything else, most importantly behind table rows,
log output, charts, or any value the operator reads. The stripe sits one
neutral step off its surface; the contract must say plainly that raising that
contrast is not an option.

### 7. Elevation — four two-layer steps, with shadow colour as a token

`color.shadow.hairline/contact/mid/deep`, then `shadow.xs/sm/md/lg` composed
from them. Making the colour a token is what lets elevation follow the theme
through the same mechanism as everything else.

### 8. Spacing — unchanged, plus `2xs: 2px`

### 9. Semantic layer — 15 slots → ~30, declared once with `light-dark()`

Existing mappings are preserved: dark sits on `neutral.900` with surfaces at
800/700; light on `neutral.200` with surfaces at 100/white.

New slots: `card`, `card-foreground`, `popover`, `popover-foreground`,
`muted`, `border-strong`, `input`, `ring`, `primary-foreground`,
`primary-hover`, `secondary`, `secondary-foreground`, `secondary-hover`,
`accent-surface`, `accent-surface-hover`, `accent-foreground`, `selected`,
`selected-border`, `selected-foreground`, `link`, a `*-surface` and
`*-border` per status, `danger-foreground`, `disabled-surface`, `sidebar`,
`sidebar-border`, `overlay`, `skeleton`, `hatch`.

**Theme selection moves to `color-scheme`.** Each token is declared once with
`light-dark()`; `:root` is `light dark`, `[data-theme="light"|"dark"]` force.
The consequence is that **system is the default** and an explicit choice is a
one-property override. This also removed three rules that could not work in
system mode (a `::selection` fork, the select chevron, and the checkbox tick,
which is now a mask painted with `primary-foreground`).

If style-dictionary cannot emit `light-dark()` today, that is the one build
change this proposal needs.

## Contract changes — `kiso/docs/`

- **`components/button.md`** — primary becomes a **solid fill** of `primary`
  with `primary-foreground` text, replacing the outline. Default height
  `size.control.md`. Add `danger`, `danger-ghost`, and a loading state that
  does not resize the button.
- `components/input.md`, `select.md`, `textarea.md`, `checkbox.md`,
  `switch.md` — heights bind to `size.control.*`.
- `components/table.md` — row height `size.control.lg`, header band on
  `muted`, header labels at `type.size.label`.
- `components/sidebar.md`, `navigation.md` — item height `size.control.sm`;
  selected item uses `selected` / `selected-foreground` plus a 2px `primary`
  inset edge.
- `components/tabs.md` — active underline is `primary`.
- `components/card.md`, `modal-dialog.md`, `table.md` — panels take their
  radius from `radius.surface` and carry the corner marks. No component
  hardcodes a panel radius.
- **NEW `components/theme-selector.md`** — three states (System / Light /
  Dark), icon-only segmented control in a settings row: name on the left,
  control flushed right. System is the default; an explicit choice persists.
  Each button needs an accessible name — a monitor glyph for "system" is a
  convention, not self-evident.
- `docs/data-interfaces.md` — chart line and progress fill use `primary`. A
  neutral-only data surface is what made the console read grey.
- `patterns/empty-states.md`, `patterns/loading.md` — hatch, its three uses,
  and the prohibition.
- `docs/accessibility.md` — 44px restated as a coarse-pointer rule.
- `docs/tokens.md` — the `size.*` group, the corner treatment, the hatch, the
  expanded semantic layer, and the `color-scheme` theme model.
- `kiso/AGENTS.md` — acknowledge `kiso/blocks/` as the one non-spec exception
  to "Kiso is spec-first".
- `docs/brand.md` — no change.

## New folder — `kiso/blocks/`

Reference screens built from the contracts: the component gallery and a full
console screen. Non-normative; if a block and a contract disagree, the
contract is right and the block is the bug.

Because it lives under `kiso/`, it **ships in the npm package** —
`files: ["kiso/", "tokens/build/"]`, verified with `npm pack --dry-run`, about
143 KB. Add `"!kiso/blocks"` to `files` if that is not wanted. It is also
reachable as `@momoi-labs/kiso/contracts/blocks/*` via the existing
`"./contracts/*"` export, which is an odd name for something that is not a
contract.

## Validation

`npm run check` must pass: `validate-dtcg`, `check-contrast`,
`check-component-token-refs`, and a clean `tokens/build/` diff.

Two things will break:

1. **`check-contrast.mjs`** does not check fill/foreground pairs at all. The
   new solid primary needs covering: `#5b3fc4` on white = 7.1:1, `#cbbdf7` on
   `#1b1a1e` = 10.0:1 — both pass, but the script cannot tell.
2. **`check-component-token-refs.mjs`** will fail until the docs name the new
   `size.*`, corner, hatch, and semantic tokens.

Finish with a changeset. Breaking token change; every consumer re-themes.

## Known issue, out of scope

The v1 neutral ramp has **two hues**: `neutral.100–600` around 40° (warm
beige), `neutral.700–900` around 260° (cool violet), so light and dark do not
read as the same family. Deliberately untouched here. If it is ever fixed, the
move that keeps the brand is warming 700–900 toward beige, not cooling
100–600. Open an issue.
