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

The default `variant="compact"` uses icons only. Each icon has the accessible
name above. See [IconButton](icon-button.md).

`variant="cards"` shows a miniature interface, a visible name, and a short
description for each option. Light and Dark previews force their own color
scheme. System shows light and dark halves to represent following the device.
The previews are decorative and hidden from assistive technology. The radio
names and keyboard behavior are the same in both variants.

```tsx
<ThemeSelector variant="cards" theme={theme} onChange={setTheme} />
```

## Layout

The compact variant uses a single row with the label on the left and the
control on the right. See [Settings](../patterns/settings.md#theme).

The cards variant places the label above a responsive grid. Wide containers
show three cards; narrower containers wrap to two columns or one. Each card
is one radio target, including its preview and description. Use it in
appearance settings where comparing the themes helps the choice.

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

Cards use `--spacing-sm` for padding and internal gaps, `--spacing-md` between
options, `--radius-md` for corners, and `--color-border` for outlines. The
selected card uses `--color-focus` for its border and `--color-accent-surface`
for its background. Previews use the current palette's background, sidebar,
foreground, border, link, and primary colors in each forced color scheme.

Do not fill the selected option with `--color-primary`. This control does not
advance a task; it is a preference, and a violet chip here competes with the
page's actual primary action.

## States

| State | Behavior |
| --- | --- |
| default | Three options, exactly one selected. |
| hover | Unselected option raises text to `--color-foreground`. |
| focus | Visible ring using `--color-ring`. Never remove it. |
| selected | Raised chip in compact mode, outlined and tinted card in cards mode, plus the accessible selected state. |
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
- Any control that offers colour scheme options beyond these three. Kiso has
  two themes. The accent is a separate axis with its own control,
  [AccentSelector](accent-selector.md).

## Related

- [tokens](../tokens.md) — how `light-dark()` and `color-scheme` resolve.
- [Settings](../patterns/settings.md#theme) — where the row lives.
- [AccentSelector](accent-selector.md) — the other appearance row.
- [Switch](switch.md) — for actual booleans.
