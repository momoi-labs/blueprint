# Kiso design tokens

Kiso tokens are a two-layer interface. `tokens/tokens.json` is the single DTCG
2025.10 source: `color.*` contains raw palette primitives, while `semantic.*`
names the roles a product needs. Components consume semantic colors only; they
must not use a primitive, a generated primitive variable, or a raw hex value.
If no semantic role fits, propose a role instead of bypassing this interface.

Install dependencies and build with Style Dictionary v5:

```sh
npm ci
npm run build
```

The build emits `tokens/build/tokens.css`, `tokens.json`, `tokens.d.ts`, and
`tokens.scss`.

Each custom property is declared **once**, in `:root`. A role whose two themes
differ is emitted as CSS `light-dark()`, and the theme is chosen by
`color-scheme`:

```css
:root                { color-scheme: light dark; }
[data-theme="light"] { color-scheme: light; }
[data-theme="dark"]  { color-scheme: dark; }
```

So the default — no `data-theme` attribute on `<html>` — follows the operating
system, with no media query and no JavaScript. An explicit choice flips one
property. See [Theme](patterns/settings.md#theme) for the full contract.

Import `tokens.css`; application CSS should need no raw color values.

```css
@import "../../tokens/build/tokens.css";

.panel {
  color: var(--color-foreground);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
```

## Semantic colors

| Role | Meaning and use | Dark primitive | Light primitive |
| --- | --- | --- | --- |
| `background` | Application canvas; never text. | `neutral.900` | `neutral.200` |
| `surface` | Cards, panels, and table rows. | `neutral.800` | `neutral.100` |
| `elevated-surface` | Menus, popovers, and dialogs. | `neutral.700` | `white` |
| `foreground` | Primary text and content that must carry the strongest hierarchy. | `neutral.100` | `neutral.900` |
| `muted-foreground` | Secondary text and labels. It remains normal-text eligible. | `neutral.400` | `neutral.600` |
| `subtle-foreground` | Placeholders, timestamps, and non-essential hints; large text only, never body copy. | `neutral.500` | `neutral.500` |
| `border` | Dividers and control outlines; never text. | `neutral.600` | `neutral.300` |
| `primary` | The main interactive action: links, active states, and primary controls. | `accent.base` | `accent.base` |
| `accent` | Secondary emphasis and highlights, not the page's main action. | `accent.300` | `accent.800` |
| `success` | Positive or completed state. | `status.success` | `status.success` |
| `warning` | Caution or a condition needing attention. | `status.warning` | `status.warning` |
| `danger` | Error or destructive action. | `status.danger` | `status.danger` |
| `info` | Neutral informational state. | `status.info` | `status.info` |
| `focus` | Keyboard focus ring; never text. | `accent.300` | `accent.base` |
| `disabled` | Disabled text and controls only. | `neutral.600` | `neutral.400` |

### Fills and their foregrounds

A filled control needs a text colour of its own. Without one it inherits the
page foreground, the fill loses its contrast, and the control degrades into an
outline — which is how a violet design system ends up rendering grey.

| Role | Meaning and use | Dark primitive | Light primitive |
| --- | --- | --- | --- |
| `primary-foreground` | Text and icons on a `primary` fill. | `neutral.900` | `white` |
| `primary-hover` | `primary` fill on hover. | `accent.300` | `accent.800` |
| `danger-foreground` | Text and icons on a `danger` fill. | `neutral.900` | `white` |
| `secondary` | Neutral button fill, range track, count badge; never text. | `neutral.700` | `neutral.300` |
| `secondary-foreground` | Text on a `secondary` fill. | `foreground` | `foreground` |
| `secondary-hover` | `secondary` fill on hover; never text. | `neutral.600` | `neutral.400` |
| `selected` | Selected row, active nav item, highlighted result; never text. | `accent.900` | `accent.200` |
| `selected-foreground` | Text on a `selected` fill. | `foreground` | `foreground` |

`primary-foreground` and `danger-foreground` invert with their fill: near-black
on the light lilac of dark theme, white on the deep violet of light theme. Both
are gated at 4.5:1 **against their own fill**, not against a surface.

### Component surfaces

| Role | Meaning and use | Dark primitive | Light primitive |
| --- | --- | --- | --- |
| `card` | Panel and card fill. Alias of `surface`. | `neutral.800` | `neutral.100` |
| `card-foreground` | Text on `card`. Alias of `foreground`. | `foreground` | `foreground` |
| `popover` | Menus, dialogs, palette. Alias of `elevated-surface`. | `neutral.700` | `white` |
| `popover-foreground` | Text on `popover`. Alias of `foreground`. | `foreground` | `foreground` |
| `muted` | Recessed fill one step off `card`: table headers, card footers, segmented tracks. | `neutral.700` | `neutral.200` |
| `sidebar` | Application shell navigation column. | `neutral.950` | `neutral.100` |
| `sidebar-border` | Divider between sidebar and content. Alias of `border`. | `border` | `border` |
| `disabled-surface` | Fill of a disabled control. | `neutral.800` | `neutral.200` |
| `skeleton` | Loading placeholder fill. | `neutral.700` | `neutral.300` |
| `overlay` | Scrim behind a modal layer. | `black` at 60% | `black` at 40% |

### Lines, tints, and state

| Role | Meaning and use | Dark primitive | Light primitive |
| --- | --- | --- | --- |
| `border-strong` | Hover outlines, switch tracks, gridlines, corner marks; never text. | `neutral.500` | `neutral.500` |
| `input` | Form control outline at rest. Alias of `border`. | `border` | `border` |
| `corner-mark` | Corner registration marks. Alias of `border-strong`. | `border-strong` | `border-strong` |
| `hatch` | Hatch stripe over a region that is not data. | `neutral.700` | `neutral.300` |
| `accent-surface` | Faintest accent tint: row hover, ghost hover; never text. | `accent.950` | `accent.50` |
| `accent-surface-hover` | Accent tint one step stronger; never text. | `accent.900` | `accent.200` |
| `ring` | Focus ring, active drag handle. Alias of `focus`. | `focus` | `focus` |
| `link` | Inline and standalone links. Alias of `primary`. | `primary` | `primary` |
| `shadow-hairline` | Shadow colour for a resting control's contact line. | `black` at 30% | `black` at 5% |
| `shadow-contact` | Shadow colour for separated and floating layers. | `black` at 40% | `black` at 8% |

`border-strong` and `corner-mark` are non-text roles but are gated at 3:1
against every surface: a registration mark that cannot be seen is not a mark.

### Status fills

Each status role gains a tinted fill and an outline, both the status hue at low
alpha. No status introduces a second hue.

| Role | Dark | Light |
| --- | --- | --- |
| `success-surface`, `warning-surface`, `danger-surface`, `info-surface` | status hue at 12% | status hue at 10% |
| `success-border`, `warning-border`, `danger-border`, `info-border` | status hue at 35% | status hue at 30% |

`warning-on-dark`, `danger-on-dark`, and `info-on-dark` are theme-invariant on
purpose. They are for surfaces that stay dark in both themes — log views and
terminals — which cannot follow `color-scheme`, so their text cannot either.

Use `foreground` for default reading, `muted-foreground` when content is
secondary but still needs normal-text contrast, and `subtle-foreground` only
for large or non-essential supporting copy. Use `primary` for the action that
drives the current task; use `accent` to draw secondary attention without
creating another primary action.

The semantic aliases deliberately point at different primitives by theme.
Status primitives and `accent.base` are themselves mode-aware, so the same
semantic role preserves its meaning and contrast rather than preserving a
literal color.

## AA gate

`scripts/check-contrast.mjs` is the build-time AA gate. In both dark and light
themes it resolves the semantic aliases and checks:

- `foreground`, `muted-foreground`, `primary`, `accent`, `success`, `warning`,
  `danger`, and `info` at **4.5:1** or better against `background`, `surface`,
  and `elevated-surface`;
- `subtle-foreground` at **3:1** or better against those surfaces, restricting
  it to large text and non-essential metadata;
- `border-strong` and `corner-mark` at **3:1** or better against those
  surfaces, per WCAG 1.4.11 for non-text boundaries;
- `focus` at **3:1** or better against `background` for visible focus rings;
- each foreground-on-fill pair — `primary-foreground` on `primary`,
  `danger-foreground` on `danger`, `secondary-foreground` on `secondary`,
  `selected-foreground` on `selected`, `card-foreground` on `card`, and
  `popover-foreground` on `popover` — at **4.5:1** or better. This pair is what
  a system without `*-foreground` slots gets wrong, so it is gated rather than
  asserted.

`disabled` and `disabled-surface` are intentionally outside the gate because
inactive controls are exempt from WCAG 1.4.3. `background`, `surface`,
`elevated-surface`, `border`, and the tinted `*-surface` roles are not text
roles. Run the gate with:

```sh
node scripts/check-contrast.mjs tokens/tokens.json
```

## Control size is not touch target

`size.control.*` is the height of a single-line control. `size.touch.min` is
the WCAG 2.2 target-size minimum. They are separate tokens because they answer
different questions, and collapsing them is what makes a dense console look
like a toy.

| Token | Value | Use |
| --- | --- | --- |
| `--size-control-xs` | 24px | Inline table-row actions, dense toolbars. |
| `--size-control-sm` | 32px | Toolbars, segmented controls, compact forms. |
| `--size-control-md` | 36px | **The default.** Buttons, inputs, selects. |
| `--size-control-lg` | 40px | Primary calls to action, table row height. |
| `--size-touch-min` | 44px | Accessibility minimum — see below. |

`--size-touch-min` is applied **only** inside `@media (pointer: coarse)`, as a
`min-height` on top of a control size. Never as the control size itself.

```css
.btn { height: var(--size-control-md); }

@media (pointer: coarse) {
  .btn { min-height: var(--size-touch-min); }
}
```

Layout sizes: `--size-sidebar` (248px) is the shell navigation column;
`--size-content-max` (1280px) is the maximum content measure. Icon boxes are
`--size-icon-sm` (14px), `--size-icon-md` (16px, the default), and
`--size-icon-lg` (20px).

## Corners: marks, not radius

Panels are square. `--radius-surface` is `0px`, and a panel's corner treatment
is a **corner mark** instead: two 1px ticks per corner, each lying along the
frame line it extends and stopping `--corner-mark-gap` short of it, so the mark
points at the corner without touching it.

| Token | Value | Meaning |
| --- | --- | --- |
| `--corner-mark` | `1` | Opacity: marks on (`1`) or off (`0`). |
| `--corner-mark-tick` | 4px | Length of one tick. |
| `--corner-mark-gap` | 2px | Distance from tick end to the frame. |

Two ticks per corner, not four. A full cross puts its other two arms directly
on top of the 1px panel border, where they are invisible; dropping them halves
the paint and makes the hollow centre explicit rather than accidental.

The gap **is** the mark. Close it and this is just a thicker border.

Marks appear on every panel, without exception. There is no rounded mode and no
`data-corners` attribute — the choice was made once, here.

The remaining radii only take the bite off controls:

| Token | Value | Use |
| --- | --- | --- |
| `--radius-xs` | 2px | Checkboxes, chart bars, the smallest controls. |
| `--radius-sm` | 3px | Extra-small buttons, focus-ring rounding. |
| `--radius-md` | 4px | **Buttons, inputs, menu items** — the control default. |
| `--radius-lg` | 5px | Segmented tracks and other control groups. |
| `--radius-full` | 9999px | Pills, dots, switches, avatars. |
| `--radius-surface` | 0px | **Panels, cards, tables, dialogs** — always. |

## Hatch

A diagonal hatch marks a region that is **not data**. It is the companion to
the corner marks, and it has exactly three sanctioned uses:

- an empty state — nothing here yet;
- a chrome band — this strip is title and controls, not content;
- an unavailable pane — the data does not exist right now.

```css
.hatch {
  background-image: repeating-linear-gradient(
    var(--hatch-angle),
    var(--color-hatch) 0,
    var(--color-hatch) var(--hatch-line),
    transparent var(--hatch-line),
    transparent var(--hatch-period)
  );
}
```

`--hatch-line` is 5px, `--hatch-period` 10px, `--hatch-angle` 45deg. The stripe
colour is one step off the surface it sits on. Do not raise the contrast to
make it "read better": if it is loud enough to notice while reading, it is in
the wrong place.

## Shadow is a colour

`--shadow-xs`, `-sm`, `-md`, and `-lg` carry the geometry. The colour is a
token — `--color-shadow-hairline` or `--color-shadow-contact` — so a shadow
deepens with the theme instead of staying a fixed black at a fixed alpha.

| Token | Use |
| --- | --- |
| `--shadow-xs` | Resting controls: buttons, inputs, selected segments. A contact line, not a shadow. |
| `--shadow-sm` | Cards and panels on the canvas. |
| `--shadow-md` | Popovers and dropdowns. |
| `--shadow-lg` | Dialogs, drawers, and the command palette — the only layers that float free. |

## Type scale

11, 12, 14, 16, 18, 22, 30 — `metadata`, `label`, `body`, `h3`, `h2`, `h1`,
`display`. Tighter than a modular ramp on purpose: these are the steps a
console actually uses, each distinguishable from its neighbour at a 14px body.
Body is 14px, not 16px, because a console is read at desk distance, in density.

## Generated files

All four files in `tokens/build/` are committed. This makes the published
artifacts directly consumable without requiring downstream projects to install
Style Dictionary. Do not edit them: change `tokens/tokens.json` or the build
configuration and regenerate. CI rebuilds the artifacts and fails if the
committed output has drifted, so `tokens/build/` is intentionally not ignored.

Published releases expose the artifacts as `@momoi-labs/kiso/tokens.css`,
`@momoi-labs/kiso/tokens.json`, `@momoi-labs/kiso/tokens.scss`, and
`@momoi-labs/kiso/tokens.d.ts`. Kiso's Markdown contracts are available below
`@momoi-labs/kiso/contracts/` so consumers can pin the contracts and generated
tokens to the same version.
