# AccentSelector

## Purpose

AccentSelector chooses which accent the interface uses: violet, terracotta,
teal, cobalt, or nocturne. It is the only sanctioned control for that choice. The theme
(light, dark, system) is a separate axis with its own control,
[ThemeSelector](theme-selector.md); the two compose.

## The five values

| Value | Meaning | `data-accent` on `<html>` |
| --- | --- | --- |
| `violet` (default) | The violet ink and fill on the warm neutrals. | Either no attribute or `data-accent="violet"`. |
| `terracotta` | Same roles, hue turned to terracotta. Neutrals unchanged. | `data-accent="terracotta"` |
| `teal` | Same roles, hue turned to teal. Neutrals unchanged. | `data-accent="teal"` |
| `cobalt` | Same roles, hue turned to cobalt. Neutrals unchanged. | `data-accent="cobalt"` |
| `nocturne` | The marketing site's palette: cool slate neutrals under the violet ink. | `data-accent="nocturne"` |

The attribute may also sit on a container, in which case only that subtree
takes the accent. A nested `data-accent="violet"` resets to the default. See
[Accents](../tokens.md#accents) for what the accent does and does not change.

An application that offers fewer accents passes the subset it supports; the
control does not have to show all five.

## Persistence

- An explicit choice persists under the key `kiso-accent`, with the value
  `violet`, `terracotta`, `teal`, `cobalt`, or `nocturne`.
- Read the stored value in a blocking inline script in `<head>`, before first
  paint, and apply it as `data-accent`. Anything later flashes.
- Storage may be unavailable. Wrap reads and writes so a failure degrades to
  `violet` rather than throwing.
- An application with a fixed accent does not render the control at all; it
  sets the attribute once, in the document.

## Anatomy

1. **Row label**: the word "Accent", on the left.
2. **Pills**: one per value, on the right, as a group. Each pill is a dot in
   that accent's `primary` fill followed by the accent's name.
3. **Preview**: below the row, one panel that shows the *selected* accent
   applied: a sidebar strip with a current-item marker, a heading, a link, a
   primary and a secondary button, and a selected row.

| Value | Pill | Accessible name |
| --- | --- | --- |
| `violet` | violet dot, "Violet" | "Violet" |
| `terracotta` | terracotta dot, "Terracotta" | "Terracotta" |
| `teal` | teal dot, "Teal" | "Teal" |
| `cobalt` | cobalt dot, "Cobalt" | "Cobalt" |
| `nocturne` | nocturne dot, "Nocturne" | "Nocturne" |

The pill names the accent, so no hover is needed to tell which is which. The
preview answers the choice: it is decorative and hidden from assistive
technology, because the names already carry the meaning. Each pill and the
preview carry their own `data-accent`, so their colours resolve under that
accent with no inline values.

The preview may be omitted where the row is inline chrome, such as a header
toolbar. In a settings card it is always present.

## Layout

A configuration row directly below the Theme row in the same card, with the
preview spanning the row's width beneath it. See
[Settings](../patterns/settings.md#theme).

```text
Theme                                   [ ▣ ][ ☀ ][ ☾ ]
Accent      (● Violet)(● Terracotta)(● Teal)(● Cobalt)(● Nocturne)
                     ┌──┬──────────────────────────────────┐
                     │  │ ▬▬▬▬▬▬                           │
                     │▬ │ ▬▬▬                              │
                     │  │ [primary] [secondary]            │
                     │  │ ░░░░░░░░░░░░░░░░ selected        │
                     └──┴──────────────────────────────────┘
```

Narrower than 360px (a sidebar footer), the label stacks over the pills and
the pills form a two-column grid, so no name wraps mid-word.

## Tokens

Pill: height `--size-control-xs`, radius `--radius-full`, border
`--color-border`, fill `--color-card`, text `--color-muted-foreground` at
`--type-size-label`, dot `--spacing-md` square in `--color-primary`.

Selected pill: border `--color-primary`, fill `--color-accent-surface`, text
`--color-foreground` at `--type-weight-medium`. The pill is outlined and
tinted, not filled with `--color-primary`: the fill is already on the dot,
and a solid pill would compete with the page's actual primary action.

Preview: 120px tall, border `--color-border`, radius `--radius-lg`, canvas
`--color-background`, strip `--color-sidebar`, marker and link `--color-link`,
buttons `--color-primary` and `--color-card` with `--color-border-strong`,
row `--color-selected`. Transitions on `--motion-duration-fast` /
`--motion-easing-standard`.

## States

| State | Behavior |
| --- | --- |
| default | The offered options, exactly one selected; the preview shows it. |
| hover | Unselected pill takes `--color-accent-surface` and `--color-foreground`. |
| focus | Visible ring using `--color-ring`. Never remove it. |
| selected | Outlined and tinted pill as above, plus the accessible selected state. The preview repaints at once. |
| disabled | Not a state. The accent is always changeable where the control is shown. |

There is no loading state. The change is local and instant; do not wait on a
server round-trip to repaint, and do not show a Toast for it.

## Accessibility

- A group of mutually exclusive options with exactly one selected, each named
  by its visible text.
- The preview is `aria-hidden`; it repeats what the pill already says.
- Announce the selection, not the resulting colours.
- Every accent passes the same [AA gate](../tokens.md#aa-gate) as the default,
  so the control does not need to warn about contrast.

## When NOT to use

- A free colour picker. Kiso has five accents; a product colour that is not
  one of them is a token proposal, not an option.
- A way to mark status or severity. Red, amber, and green are not accents for
  that reason: a primary button in the danger hue reads as destructive.
- Per-user branding inside a single product. One accent per product, or per
  product area, chosen by the product.

## Related

- [tokens](../tokens.md#accents): what an accent changes and how it is built.
- [ThemeSelector](theme-selector.md): the other appearance row.
- [Settings](../patterns/settings.md#theme): where the row lives.
