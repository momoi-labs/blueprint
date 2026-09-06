# Dot

## Purpose

Dot adds a small decorative status cue beside text. [Badge](badge.md) carries
a status label; Dot supplies only the colored mark. Keep readable status text
beside it, whether inside a Badge or elsewhere in the row.

## Anatomy

A single `span`, hidden from assistive technology with `aria-hidden="true"`.
An optional pulse adds a halo behind the mark. Dot contains no label or control.

## Variants

Status is spelled `variant`, matching Badge.

| Variant | Meaning | Color |
| --- | --- | --- |
| `neutral` (default) | No severity. | Inherits `currentColor` from its context. |
| `info` | Informational state. | `--color-info` |
| `success` | Healthy or complete. | `--color-success` |
| `warning` | Needs attention. | `--color-warning` |
| `danger` | Failed or blocked. | `--color-danger` |

`pulse` defaults to `false`. Enable it only for a live activity cue that the
adjacent text also explains. The halo uses `currentColor` and a two-second
animation with `--motion-easing-standard`.

## Sizes

`size="md"` is the default 6px mark; `size="lg"` is 8px. Both use
`--radius-full` and do not shrink in a flex row. These are visual marks,
not pointer targets.

## States

The mark is static unless `pulse` is enabled. A status change updates the
variant and accompanying text together. There are no hover, focus, active,
or disabled states.

## Accessibility

- Keep Dot decorative. Do not use it as the only indication of status or
  override its hidden semantics to make an icon-only status label.
- Communicate status and activity with text; color and motion are extra cues.
- Respect reduced-motion preferences by leaving `pulse` off for those users.
  Dot does not detect the preference itself.
- Necessary status announcements belong to the surrounding region, not Dot.

### Keyboard

No keymap and no tab stop. Dot is never an action.

## When to use

- A health cue beside "Running", "Degraded", or "Stopped".
- A decorative mark inside a Badge that already names the state.

## When NOT to use

- A status with no accompanying text. Use Badge with a label.
- Notification counts or clickable indicators.
- Indeterminate work that needs a loading indicator. Use [Spinner](spinner.md).

## Radix/shadcn mapping

No dedicated Dot primitive. A decorative span consumes Kiso status colors;
Badge remains the reference for variant names and meanings.
