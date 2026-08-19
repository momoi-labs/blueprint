# IconButton

Triggers an in-page action whose only visible content is an icon. It must
expose an accessible name with `aria-label` (or `aria-labelledby`).

## Purpose

IconButton is Button without a visible text label: compact chrome, toolbars,
dismiss controls, and header actions where a word would not fit.

It is still an *action*. It does not navigate. If the icon takes the person
to a URL, use [Link](link.md) with an icon, not IconButton.

### Choose the right control

| Need | Control |
| --- | --- |
| Action with a visible text label (icon optional) | **[Button](button.md)** |
| Action with *only* an icon | **IconButton** |
| Navigation (URL changes) | **[Link](link.md)** |

If the icon is not universally understood on its own, prefer Button with a
visible label. IconButton is a density choice, not a decoration choice.

[Tooltip](tooltip.md) may repeat the accessible name on hover/focus. Tooltip
is progressive enhancement: it is not a substitute for `aria-label`, and it
is not available on touch. The `aria-label` is the name; the Tooltip is
optional clarification for pointer and keyboard users.

## Anatomy

```
IconButton
├── icon (required, visually only)
├── accessible name (required, not visible: aria-label or aria-labelledby)
├── Tooltip (optional; same words as the accessible name)
└── Spinner (loading state only; replaces the icon)
```

- **Icon.** Decorative. `aria-hidden="true"` so the name is not announced
  twice.
- **Accessible name.** Short verb phrase, same rules as Button labels:
  "Dismiss", "Open command palette", "Refresh replicas". Not "Button", not
  the icon's filename.
- **Tooltip.** If present, its content *equals* the accessible name. Never
  add extra essential instructions in the Tooltip.

## Variants

Same four variants as [Button](button.md). Same token mapping. Same rule:
no "link" variant.

| Variant | Typical IconButton use |
| --- | --- |
| `default` | Standalone compact action on a surface. |
| `primary` | Rare. A single icon as the region's main action (e.g. "Run"). Prefer a labeled Button when space allows. |
| `destructive` | Irreversible icon action (delete). Confirm before committing; the icon alone is easy to hit by mistake. |
| `ghost` | Default for chrome: Header actions, Card header actions, Alert dismiss, table row actions. |

Header (a later navigation slice) composes Link + IconButton. IconButton in
that role is `ghost`.

## Sizes

Square hit targets. Icon centered. Radius `--radius-md` (`sm` size uses
`--radius-sm`).

| Size | Type / icon | Padding | Use |
| --- | --- | --- | --- |
| `sm` | Icon scaled to `--type-role-metadata-font-size` | `--spacing-xs` | Inside Alert, Badge-adjacent chrome, dense tables. |
| `md` (default) | Icon scaled to `--type-role-label-font-size` | `--spacing-sm` | Toolbars, Card actions, Header. |
| `lg` | Icon scaled to `--type-role-body-font-size` | `--spacing-md` | Rare; empty-state or touch-first primary icon. |

The hit target must remain easy to activate; do not shrink `sm` below the
spacing tokens above.

## States

Identical in meaning to [Button](button.md):

| State | Notes |
| --- | --- |
| default | Interactive. |
| hover | Variant hover tokens. |
| focus | Visible ring using `--color-focus`. Tooltip, if any, opens on focus (see Tooltip keyboard). |
| active | Pressed. |
| disabled | Native `disabled`. `--color-disabled`. If the person needs to know *why*, put that in adjacent copy — not only in a Tooltip (Tooltip is not on touch and is never essential). |
| loading | `aria-busy="true"`. Replace the icon with [Spinner](spinner.md) of the matching size. Ignore further activations. Distinct from disabled (user story #12). |
| error | Not an IconButton state. |

## Accessibility

- Native `<button type="button">` unless it submits (`type="submit"`).
- **Accessible name is mandatory.** Set `aria-label` or point
  `aria-labelledby` at visible text elsewhere. An IconButton without a name
  is a spec violation, not a styling choice.
- The SVG/icon is `aria-hidden="true"` (and `focusable="false"` if the
  graphic could take focus).
- Do not use a different `aria-label` than the Tooltip text.
- Touch: there is no Tooltip. The icon must be understandable from context
  (a well-known metaphor next to the thing it affects) or the control must
  be a labeled Button instead.
- Focus ring uses `--color-focus`. Never omit it because "the tooltip
  explains the control".

### Keyboard

| Key | Action |
| --- | --- |
| `Enter` | Activate. |
| `Space` | Activate. |
| `Tab` / `Shift+Tab` | Move focus. |

Tooltip keyboard (open on focus, dismiss on `Escape`) is defined in
[Tooltip](tooltip.md). Activation of the IconButton dismisses the Tooltip.

## When to use

- A compact action where a text label would add noise: dismiss, overflow
  menu, refresh, copy, favorite, close.
- Header and toolbar actions.
- The accessible name is a short, specific verb, and the icon is recognizable
  in context.

## When NOT to use

- **There is room for a text label.** Use [Button](button.md). Density is
  not a reason to hide the verb on a primary action.
- **Navigation.** Use [Link](link.md). A "settings gear" that goes to
  `/settings` is a Link, possibly styled as an icon.
- **The only explanation of the control is a Tooltip.** Tooltip is never
  essential (user story #10). If the person cannot succeed without the
  Tooltip, use a labeled Button.
- **Touch-first primary actions** that are not standard metaphors (close,
  search, add). Prefer Button with text.
- **Toggle with two lasting states** (on/off). Use Switch (form slice).

## Radix/shadcn mapping

No dedicated Radix or shadcn `IconButton` primitive. Implement as shadcn
[Button](https://ui.shadcn.com/docs/components/button) with an icon size:

| Kiso | shadcn |
| --- | --- |
| IconButton `sm` | `size="icon-sm"` (or `icon-xs` only if it still uses `--spacing-xs` padding) |
| IconButton `md` | `size="icon"` |
| IconButton `lg` | `size="icon-lg"` |
| variants | Same Button mapping as [Button](button.md) (Kiso `primary` and `default` both start from shadcn `outline`, restyled) |

Always pass `aria-label`. Do not rely on the icon's title or a Tooltip
alone.

Radix [Slot](https://www.radix-ui.com/primitives/docs/utilities/slot)
(`asChild`) is allowed only to merge IconButton props onto a native
`<button>`. That is the shadcn Button `asChild` path. It must not target
an `<a>` — that is [Link](link.md).

Optional Tooltip: wrap with shadcn/Radix [Tooltip](tooltip.md) and set the
content to the same string as `aria-label`.

Do not use shadcn `variant="link"`.
