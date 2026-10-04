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

The dark theme draws its surfaces from a dedicated warm dark ramp
(`color.dark.*`), not from the tail of the light ramp: one hue family for both
themes, with layer spacing that lets the sidebar sink below the canvas and the
card lift above it. The accent is split into two roles. The **ink**
(`accent.base`, flowing into `link` and `focus`) is the text-eligible lilac for
links, focus rings, and active indicators. The **fill** (`primary` and its
hover and surface tints) is the deep violet behind `primary-foreground`,
never text on dark.

| Role | Meaning and use | Dark primitive | Light primitive |
| --- | --- | --- | --- |
| `background` | Application canvas; never text. | `dark.900` | `neutral.200` |
| `surface` | Cards, panels, and table rows. | `dark.800` | `neutral.100` |
| `elevated-surface` | Menus, popovers, and dialogs. | `dark.700` | `white` |
| `foreground` | Primary text and content that must carry the strongest hierarchy. | `dark.100` | `neutral.900` |
| `muted-foreground` | Secondary text and labels. It remains normal-text eligible. | `dark.400` | `neutral.600` |
| `subtle-foreground` | Large supporting text and non-text graphics where the surface provides 3:1 contrast; never small text. | `dark.450` | `neutral.500` |
| `border` | Dividers and control outlines; never text. | `dark.600` | `neutral.300` |
| `primary` | The primary fill: primary buttons, solid badges, checked controls, the brand mark. Not text-eligible on dark. | `#684bb5` | `#5b3fc4` |
| `accent` | Secondary emphasis and highlights, not the page's main action. | `accent.300` | `accent.800` |
| `success` | Positive or completed state. | `status.success` | `status.success` |
| `warning` | Caution or a condition needing attention. | `status.warning` | `status.warning` |
| `danger` | Error or destructive action. | `status.danger` | `status.danger` |
| `info` | Neutral informational state. | `status.info` | `status.info` |
| `focus` | Keyboard focus ring; never text. The light ink. | `accent.base` | `accent.base` |
| `disabled` | Disabled text and controls only. | `dark.600` | `neutral.400` |

### Fills and their foregrounds

A filled control needs a text colour of its own. Without one it inherits the
page foreground, the fill loses its contrast, and the control degrades into an
outline — which is how a violet design system ends up rendering grey.

| Role | Meaning and use | Dark primitive | Light primitive |
| --- | --- | --- | --- |
| `primary-foreground` | Text and icons on a `primary` fill. | near-white `#f7f5fe` | `white` |
| `primary-hover` | `primary` fill on hover. | `#795dc9` | `accent.800` |
| `danger-foreground` | Text and icons on a `danger` fill. | `dark.950` | `white` |
| `secondary` | Neutral button fill, range track, count badge; never text. | `dark.700` | `neutral.300` |
| `secondary-foreground` | Text on a `secondary` fill. | `foreground` | `foreground` |
| `secondary-hover` | `secondary` fill on hover; never text. | `dark.600` | `neutral.400` |
| `selected` | Selected row, active nav item, highlighted result; never text. One step past `accent-surface-hover`, so selection and hover stay apart. | `#49406d` | `accent.300` |
| `selected-foreground` | Text on a `selected` fill. | `foreground` | `foreground` |

`primary-foreground` is near-white (`#f7f5fe`) on the deep violet fill in both
themes; the fill no longer flips to a light lilac on dark, so the foreground
no longer inverts. `danger-foreground` still inverts with its fill: white on
the light-theme red, near-black on the dark-theme salmon. Both are gated at
4.5:1 **against their own fill**, not against a surface.

### Component surfaces

| Role | Meaning and use | Dark primitive | Light primitive |
| --- | --- | --- | --- |
| `card` | Panel and card fill. Alias of `surface`. | `dark.800` | `neutral.100` |
| `card-foreground` | Text on `card`. Alias of `foreground`. | `foreground` | `foreground` |
| `popover` | Menus, dialogs, palette. Alias of `elevated-surface`. | `dark.700` | `white` |
| `popover-foreground` | Text on `popover`. Alias of `foreground`. | `foreground` | `foreground` |
| `muted` | Recessed fill one step off `card`: table headers, card footers, segmented tracks. | `dark.700` | `neutral.200` |
| `sidebar` | Application shell navigation column. | `dark.950` | `neutral.100` |
| `sidebar-border` | Divider between sidebar and content. Alias of `border`. | `border` | `border` |
| `disabled-surface` | Fill of a disabled control. | `dark.800` | `neutral.200` |
| `skeleton` | Loading placeholder fill. | `dark.700` | `neutral.300` |
| `overlay` | Scrim behind a modal layer. | `black` at 60% | `black` at 40% |

### Lines, tints, and state

| Role | Meaning and use | Dark primitive | Light primitive |
| --- | --- | --- | --- |
| `border-strong` | Hover outlines, switch tracks, gridlines, corner marks; never text. | `dark.450` | `neutral.500` |
| `input` | Form control outline at rest. Alias of `border`. | `border` | `border` |
| `corner-mark` | Corner registration marks. Alias of `border-strong`. | `border-strong` | `border-strong` |
| `hatch` | Hatch stripe over a region that is not data. | `dark.700` | `neutral.300` |
| `accent-surface` | Faintest accent tint: row hover, ghost hover; never text. | `#2d2843` | `accent.50` |
| `accent-surface-hover` | Accent tint one step stronger; never text. | `#3a3356` | `accent.200` |
| `ring` | Focus ring, active drag handle. Alias of `focus`. | `focus` | `focus` |
| `link` | Inline and standalone links. The light ink: alias of `accent.base`, text-eligible where the `primary` fill is not. | `accent.base` | `accent.base` |
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
for large supporting copy or non-text graphics on surfaces that provide at
least 3:1 contrast. Use `primary` for the fill of the action that drives the
current task; use `link` for anything that reads as a
link or an active indicator, because the fill is not text-eligible on dark.
Use `accent` to draw secondary attention without creating another primary
action.

The semantic aliases deliberately point at different primitives by theme.
Status primitives and `accent.base` are themselves mode-aware, so the same
semantic role preserves its meaning and contrast rather than preserving a
literal color. `border-strong` and `subtle-foreground` sit on `dark.450` on
dark because `dark.500` misses the 3:1 non-text and large-text gates on
`dark.800` and `dark.700`; they share a step on dark exactly as they share
`neutral.500` on light.

## Accents

The accent is a second axis over the same custom properties, orthogonal to the
theme. Five accents ship: `violet` (the default), `terracotta`, `teal`,
`cobalt`, and `nocturne`. The first four are hue turns: each is a primitive
ramp (`color.violet.*`, `color.terracotta.*`, and so on) with the same
lightness per step, so every role keeps the contrast it was gated at.
`color.accent.*` is the *active* ramp: an alias layer that points at violet by
default.

`nocturne` is different in kind. It is the marketing site's palette: the
violet ramp and ink over cool slate neutrals (hue 278) instead of the warm
ones. It is the one accent that restates the neutral roles, surfaces, text,
borders, and neutral fills alike, because the slate is the palette, not a
tint on it. A hue accent nested inside a nocturne container keeps the slate
and changes only the accent. Its surface, text, and accent values are the
site's own, gated like every other accent; the roles the site never named are
Kiso's lightness in the slate hue.

An accent is chosen with `data-accent` on `<html>`, or on any container:

```html
<html data-accent="teal">
```

No attribute means violet. The build emits one `[data-accent="<name>"]` block
per accent from the `accent.<name>` group in `tokens/tokens.json`. That block
restates only the roles that follow the hue:

- the active ramp, `--color-accent-50` to `--color-accent-950` and
  `--color-accent-base`, remapped to the named ramp. `link`, `focus`, `ring`,
  `accent`, and the light-theme tints alias the ramp, so they follow without
  being restated;
- the raw-hex dark fills: `primary`, `primary-hover`, `primary-foreground`,
  `accent-surface`, `accent-surface-hover`, and `selected`.

The neutral roles are not restated. The warm grey carries the interface under
every hue accent, and only the accent changes: a teal product and a violet
product share the same canvas, text, and borders. Tinting the neutrals toward
the hue was tried and rejected; at any visible strength it reads as a filter
over the screen rather than as a colour choice.

Values inside the block still use `light-dark()`, so accent and theme compose
without a cross product: five accents and two themes are five blocks, not
ten. Nesting resets cleanly: a `data-accent="violet"` container inside a
teal page is violet again.

Chart series do not follow the accent. `chart-1` is pinned to the violet ink
because a terracotta, teal, or cobalt series collapses into the warning, success,
or info series; see [Categorical chart colors](#categorical-chart-colors).
Status roles do not follow it either. Red, amber, and green were rejected as
accents for the same reason: a primary button in the danger hue reads as
destructive.

Applications own the choice and its persistence, exactly as with the theme.
Use [AccentSelector](components/accent-selector.md) for the control.

## AA gate

`scripts/check-contrast.mjs` is the build-time AA gate. In both dark and light
themes, for the default and for every accent, it resolves the semantic aliases
and checks:

- `foreground`, `muted-foreground`, `link`, `accent`, `success`, `warning`,
  `danger`, and `info` at **4.5:1** or better against `background`, `surface`,
  and `elevated-surface`. `link` is gated, not `primary`: since the ink/fill
  split, `primary` is the deep fill and is not text-eligible on dark, while
  the ink that links and indicators actually draw with is `link`;
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

## Corners and appearance

Panels are square by default. `--radius-surface` is `0px`, and a panel's corner treatment
is a **corner mark** instead: two 1px ticks per corner, each lying along the
frame line it extends and stopping `--corner-mark-gap` short of it, so the mark
points at the corner without touching it.

| Token | Value | Meaning |
| --- | --- | --- |
| `--corner-mark` | `1` | Marks on (`1`) or off (`0`). Off marks also drop their inset, so they add no overflow to a scroll container around the panel. |
| `--corner-mark-tick` | 4px | Length of one tick. |
| `--corner-mark-gap` | 2px | Distance from tick end to the frame. |

Two ticks per corner, not four. A full cross puts its other two arms directly
on top of the 1px panel border, where they are invisible; dropping them halves
the paint and makes the hollow centre explicit rather than accidental.

The gap **is** the mark. Close it and this is just a thicker border.

Marks appear on panels by default. Applications can select another treatment
with the appearance attributes below.

The remaining radii only take the bite off controls:

| Token | Value | Use |
| --- | --- | --- |
| `--radius-xs` | 2px | Checkboxes, chart bars, the smallest controls. |
| `--radius-sm` | 3px | Extra-small buttons, focus-ring rounding. |
| `--radius-md` | 4px | **Buttons, inputs, menu items** — the control default. |
| `--radius-lg` | 5px | Segmented tracks and other control groups. |
| `--radius-full` | 9999px | Pills, dots, switches, avatars. |
| `--radius-surface` | 0px | **Panels, cards, tables, dialogs** by default. |

### Appearance attributes

Set these attributes on `<html>` so they also reach portalled dialogs and menus.
They ship in `@momoi-labs/kiso/ui.css`, which React's stylesheet imports.
No gallery CSS or JavaScript is required.

| Attribute | Values | Default when omitted |
| --- | --- | --- |
| `data-border-style` | `solid`, `none`, `rail`, `dash`, `bevel`, `double`, `base`, `offset`, `manga`, `brush` | Solid outline |
| `data-corner-style` | `square`, `rounded`, `asym`, `pixel` | Square panels and existing control radii, or the legacy border style's radii |
| `data-corner-size` | `off`, `small`, `medium`, `large` | `medium` |
| `data-corner-marks` | `none`, `ticks`, `brackets`, `arcs`, `diagonal`, `dots` | `ticks` |
| `data-mark-size` | `small`, `medium`, `large` | `medium` |
| `data-visual-style` | `default`, `editorial` | `default` |
| `data-app-shell` | `default`, `inset` | `default` |

Border treatment and corner shape are independent. `none` removes panel
outlines, decorative edges, shadows and corner marks. It keeps panel surfaces,
internal separators, control borders, status rails and focus indicators.
It applies to the same frames as the other border styles: cards, tables,
dialogs, drawers, palettes, log viewers, code blocks and inset shell content.
Menus and tooltips keep their own outlines and elevation.

| Corner shape | Panel radius | Control radius |
| --- | --- | --- |
| `square` | 0px | 4px |
| `rounded` | 16px | 8px |
| `asym` | 12px / 3px | 6px / 2px |

`data-corner-size` scales the radii selected by `data-corner-style`: `off`
sets them to zero; `small`, `medium`, and `large` use 0.5, 1, and 1.5 times
that style's radii. Square panels stay square and their control radii stay
unchanged unless the size is `off`. Size does not hide marks; use
`data-corner-marks="none"` for that. Border style `none` also suppresses marks
without changing the saved mark choice.

Rounded has one type with three sizes: small uses 8px panel and 4px control
corners, medium uses 16px and 8px, and large uses 24px and 12px.

Legacy `data-border-style="square"`, `"soft"`, `"round"` and `"asym"`
remain supported with their original radii. Set `data-corner-style` to override
those radii. An explicit corner choice is inherited through nested border
scopes. A nested border scope can restore an outline inside a frameless region.
The earlier corner values `soft` and `round` also retain their original radii.
The gallery uses a single Rounded choice with a separate size control.

Mark sizes set `--corner-mark-tick` and `--corner-mark-gap` to 2px/1px,
4px/2px, or 8px/4px. Border styles override the existing radius tokens.
The generated token defaults remain unchanged.

```html
<html lang="en" data-accent="terracotta" data-border-style="solid" data-corner-style="rounded"
  data-corner-size="small" data-corner-marks="arcs" data-mark-size="medium">
```

Keep scrolling on `.log-scroll`, `.table-scroll`, dialog bodies, and
`pre > code`. The outer frame owns the marks, which extend outside it.

### Frames, scopes, and backgrounds

Pixel classic (`data-corner-style="pixel"`) paints two steps at each corner.
Manga (`data-border-style="manga"`) and Brush (`"brush"`) own their contour
and ink stroke. They retain the saved corner choice but do not combine it with
another shape. Pixel uses a crisp outline; choose a standard corner to use
Dashed, Double, Side rail, Weighted base, or Offset.

| Attribute | Values | Default when omitted |
| --- | --- | --- |
| `data-frame-scope` | `outer`, `panels`, `all` | Existing panel and control styling |
| `data-mark-scope` | `outer`, `panels`, `all` | `panels` |
| `data-outer-border-style` | `inherit` or a border value | `inherit` |
| `data-outer-corner-style` | `inherit` or a corner value | `inherit` |
| `data-outer-corner-marks` | `inherit` or a mark value | `inherit` |
| `data-mark-clearance` | `normal`, `sheet` | `normal` |
| `data-background-style` | `solid`, `dots`, `grid`, `crosses`, `construction`, `guides`, `fibers`, `momoi`, `momoi-repeat` | `solid` |
| `data-background-strength` | `quiet`, `visible` | `quiet` |
| `data-background-placement` | `inside`, `outside`, `both` | `both` |
| `data-paper-tone` | `theme`, `accent` | `theme` |
| `data-frame-detail` | `small`, `medium`, `large` | `medium` |
| `data-panel-fill` | `solid`, `translucent` | `solid` |

Set these on `html`, alongside theme and accent. The outer choices apply to
inset AppShell main frames. Their children and portals retain the inner
choices from `data-border-style`, `data-corner-style`, and `data-corner-marks`.
A nested attribute can override its inherited inner choice.

Frame scope `outer` removes inner panel decoration and uses standard control
corners. `panels` styles the outer frame and inner panels, with standard
controls. `all` also styles controls. Native controls retain their rectangular
hit area. Pixel controls use smaller steps, and a focused Pixel field thickens
its own stepped edge instead of drawing a separate ring. Manga and Brush use a
compact, heavy outline. Menus and tooltips keep their standard outlines.

Mark scope is independent. `outer` limits marks to inset shell frames;
`panels` includes inner panel frames; `all` adds compact internal guides to
fields and framed buttons. These internal guides avoid projecting into adjacent fields.
`none` hides marks, and Border None suppresses them without discarding the saved
selection. Incompatible curved marks on Pixel, Manga or Brush, and brackets on Brush,
stay saved but are hidden until the frame supports them.
`sheet` adds clearance; Offset and expressive borders also reserve
space for their stroke. Curved brackets follow the selected radius, including
Asymmetric's smaller corners.

The gallery keeps Inset edge (`bevel`) and Corner dots (`dots`) readable as
legacy selections. CSS consumers can continue using them. Replacing a legacy
selection removes it from the gallery's normal picker.

Backgrounds belong to the outermost AppShell content canvas, excluding its
navigation and settings rails. Add `data-background-canvas` to an embedded
shell only when it should own a separate background. Cards and portals never
receive their own watermark. All patterns work with the current theme and
accent; they do not select a theme.

Construction lines (`construction`) is a repeating major/minor grid. Drawing
guides (`guides`) restores the study's margin lines and central drafting axes.
`inside` aligns the pattern to the inset frame. `outside` places it around an
opaque main surface. `both` continues the pattern behind the content and its
margin. The Momoi signature remains one symbol; translucent fill can reveal
the part that extends behind the frame.

Accent paper uses the existing accent surface color on the canvas and cards.
Navigation and settings share that paper; portals keep their regular surfaces. Cobalt, dark
theme, accent paper, drawing guides inside, square panels, an outer Double
outline and Original ticks reproduce the Blueprint study. The gallery's
composition buttons apply ordinary settings and remain editable.

New gallery visits and Reset appearance use Pixel everywhere: small Pixel
corners, Original ticks on panels, paper fibers, solid fill, Editorial style and
an inset shell.
The Default preset preserves the previous square, solid-background appearance.
Both presets follow the system theme. Saved preferences still take priority.
These gallery defaults do not change the CSS defaults for package consumers.
Random chooses compatible appearance settings while keeping the selected theme.

Frame detail scales Manga's stroke and slant, and Brush's stroke width.
Corner size controls Rounded, Asymmetric and Pixel. The gallery groups these
controls under Main style. Outer frame overrides live in a collapsed
Customize outer frame disclosure and share the size settings.

Momoi uses the symbol without its badge, at a preferred width of 160px and
16px from the canvas's right and bottom edges. It scales down when the canvas
cannot fit it. It uses the same frame margin as other patterns, so changing to
the watermark does not shrink the frame. Quiet and Visible use 14% and 22%
opacity on the background layer only.
`momoi-repeat` is a separate tiled option.

Patterned canvases use foreground color for secondary text so labels remain
legible over the pattern. Solid keeps the existing theme typography.

Translucent paints cards at 65% opacity for every background. It clears the
outer fill for inside/both placement and for the Momoi signature.
Text stays opaque and secondary text uses the foreground color. Fields, code,
tables, and overlays retain solid backing. Forced colors suppress decorative
backgrounds and retain native outlines.

```html
<html lang="en" data-theme="dark" data-accent="violet"
  data-app-shell="inset" data-border-style="solid"
  data-corner-style="square" data-corner-marks="none"
  data-outer-border-style="brush" data-outer-corner-marks="none"
  data-frame-scope="panels" data-mark-scope="outer"
  data-background-style="momoi" data-background-strength="quiet"
  data-panel-fill="translucent">
```

### Visual styles

Set `data-visual-style="editorial"` on `html` to apply one hierarchy across
page titles, section headings, cards, metrics, and page layouts. Color, border
style, corner marks, and the application frame remain separate choices.

| Presentation token | Default | Editorial |
| --- | --- | --- |
| `--presentation-page-title-size` | 22px | 30px to 48px, responsive |
| `--presentation-section-title-size` | 18px | 22px |
| `--presentation-card-title-size` | 16px | 18px |
| `--presentation-metric-size` | 30px | 30px to 48px, responsive |
| `--presentation-page-padding` | 24px | 24px to 32px, responsive |
| `--presentation-section-gap` | 24px | 32px |
| `--presentation-grid-gap` | 16px | 24px |
| `--presentation-panel-padding` | 16px | 16px to 24px, responsive |
| `--presentation-panel-gap` | 12px | 16px |
| `--presentation-heading-gap` | 2px | 8px |

These aliases reuse the existing type and spacing scales. The stylesheet
remaps them without changing base tokens. Buttons, fields, navigation, badges,
table cells, chart labels, and code keep their existing dimensions and text
sizes. PageHeader also adds its editorial description and vertical spacing.

Page, Card, Stat, and DashboardGrid consume these tokens directly. Custom
page compositions should use the page padding, section gap, and grid gap
tokens for their corresponding regions. Typography classes `t-h1`, `t-h2`,
`t-h3`, and `t-display` follow the same hierarchy.

```html
<html lang="en" data-visual-style="editorial" data-app-shell="inset">
```

Set `data-visual-style="default"` on a region to keep that region compact.
Its descendants inherit the local choice. PageHeader's explicit `variant`
still overrides its heading treatment. The earlier `data-page-header`
attribute remains supported for heading-only compositions.

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

`--type-size-editorial` adds a 48px ceiling for the optional editorial
PageHeader. Its title scales down to the existing 30px display step on narrow
screens. Default page headings and stat values keep their existing sizes.

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

## Categorical chart colors

Issue #93 adds `--color-chart-1` through `--color-chart-5` for series identity.
The roles derive from violet.base, status.success, status.warning, status.info,
and status.danger, in that order. `chart-1` is the violet ink under every
accent, not the active accent: a series must stay distinguishable from the
status series whatever the product's accent is. Their meaning inside a chart is categorical,
never health or severity. Existing status roles keep their meaning elsewhere.

Each slot meets 3:1 on background, surface, and elevated-surface in both
themes, enforced by the contrast gate. Lines use full-opacity strokes; area
fills are secondary at 0.2 opacity. Every series also has a numbered label,
an interactive highlight, a legend value, and exact sample values. Do not
use filled bands or hue alone to identify data. Five slots cover pg-probe;
the epic's proposed eight-slot headroom is deferred until needed.

The palette gate also checks Oklab lightness bands (0.40 to 0.65 in light mode,
0.70 to 0.90 in dark mode), chroma of at least 0.08, all-pair normal-vision
distance of at least 0.10, and adjacent-pair distance of at least 0.05 under
full protanopia and deuteranopia simulation. These are product regression
floors, not accessibility standards or a guarantee of hue discrimination.
Keep the canonical slot order in stacks; changing adjacency needs review.

The calculation uses [Oklab](https://bottosson.github.io/posts/oklab/) and
[Machado's simulation model](https://pubmed.ncbi.nlm.nih.gov/19834201/).
Run `node scripts/check-chart-palette.mjs` for both themes and every accent. Numbered labels,
highlighting, and tables remain required even when these checks pass.
