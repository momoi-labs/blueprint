# ThemeSelector

## Purpose

ThemeSelector chooses which colour scheme the interface uses: follow the
operating system, force light, or force dark. It is the only sanctioned control
for that choice.

## The three values

| Value | Meaning | `data-theme` on `<html>` |
| --- | --- | --- |
| `system` (default) | Follow the operating system, and keep following it when it changes. | **No attribute at all.** |
| `light` | Force light regardless of the OS. | `data-theme="light"` |
| `dark` | Force dark regardless of the OS. | `data-theme="dark"` |

`system` is the absence of the attribute, not `data-theme="system"`. The tokens
declare `color-scheme: light dark` on `:root`, so with no attribute present
every `light-dark()` value already resolves against the OS preference — no
media query, no JavaScript, no flash. An explicit choice only has to narrow
`color-scheme` to one keyword. See [tokens](../tokens.md).

Do not implement `system` by reading `prefers-color-scheme` and writing
`data-theme`. That freezes the choice at page load and stops following the OS.

## Persistence

- An explicit choice persists under the key `kiso-theme`, with the value
  `light` or `dark`.
- Choosing `system` persists the literal `system` **and removes** the
  attribute.
- Read the stored value in a blocking inline script in `<head>`, before first
  paint, and apply it only when it is not `system`. Anything later flashes.
- Storage may be unavailable (private mode, disabled cookies). Wrap reads and
  writes so a failure degrades to `system` rather than throwing.

## Anatomy

1. **Row label** — the word "Theme", on the left.
2. **Segmented control** — the three values, on the right, as a group.
3. **Options** — one per value, each an icon with an accessible name.

| Value | Icon | Accessible name |
| --- | --- | --- |
| `system` | monitor | "Follow system" |
| `light` | sun | "Light theme" |
| `dark` | moon | "Dark theme" |

Icon-only. The three concepts are conventional enough that icons carry them,
and visible text would make the row wider than the setting deserves. The
accessible name is required, not optional — see
[IconButton](icon-button.md).

## Layout

A single configuration row: label left, control right, aligned to the baseline
of the label. This is the standard settings row, not a Card of its own. See
[Settings](../patterns/settings.md#theme).

```text
Theme                                   [ ▣ ][ ☀ ][ ☾ ]
```

## Tokens

Track `--color-muted`, border `--color-border`, radius `--radius-lg`, padding
`--spacing-2xs`, gap `--spacing-2xs`. Each option is `--size-control-sm` high,
radius `--radius-md`, text `--color-muted-foreground`, icon `--size-icon-sm`.

The selected option takes `--color-card`, `--color-foreground`, and
`--shadow-xs` — a raised chip inside a recessed track. Transition on
`--motion-duration-fast` / `--motion-easing-standard`.

Do not fill the selected option with `--color-primary`. This control does not
advance a task; it is a preference, and a violet chip here competes with the
page's actual primary action.

## States

| State | Behavior |
| --- | --- |
| default | Three options, exactly one selected. |
| hover | Unselected option raises text to `--color-foreground`. |
| focus | Visible ring using `--color-ring`. Never remove it. |
| selected | Raised chip as above, plus the accessible selected state. |
| disabled | Not a state. The theme is always changeable. |

There is no loading state. The change is local and instant; do not wait on a
server round-trip to repaint, and do not show a Toast for it.

## Accessibility

- Use a radio group or a tablist — a set of three mutually exclusive options
  with exactly one selected. Do not use three independent toggle buttons.
- Each option carries a visible-to-AT name from the table above.
- Arrow keys move between options; the group is one tab stop.
- Announce the selection, not the resulting colours.
- The control must remain operable at the current theme's contrast in both
  themes; it is chrome, so it is gated like any other control.

## When NOT to use

- A single "dark mode" Switch. A boolean cannot express "follow the system",
  which is the default and the most common choice.
- A theme entry buried inside a DropdownMenu as the only access point. A menu
  may mirror the control, but the setting lives in a settings row.
- Any control that offers colour options beyond these three. Kiso has two
  themes.

## Related

- [tokens](../tokens.md) — how `light-dark()` and `color-scheme` resolve.
- [Settings](../patterns/settings.md#theme) — where the row lives.
- [Switch](switch.md) — for actual booleans.
