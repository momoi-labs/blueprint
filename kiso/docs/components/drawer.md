# Drawer

A viewport-adaptive overlay that enters from an edge and can replace a Modal
when a small viewport needs a more usable layout.

## Purpose

Drawer preserves context while giving forms, details, or focused tasks more
vertical room. Use it as the small-viewport presentation of the same task that
may appear in [Modal/Dialog](modal-dialog.md) on larger viewports; behavior and
accessible name stay consistent across the switch.

## Anatomy

```
Drawer Root
├── Trigger
├── Overlay
└── Content
    ├── handle (optional, decorative)
    ├── Title
    ├── Description (optional)
    ├── body
    ├── actions
    └── Close control
```

Content uses `--color-elevated-surface`, `--color-foreground`,
`--color-border`, `--spacing-lg` padding, `--radius-surface`, and
`--shadow-lg`. The scrim uses `--color-overlay`. Panels are square (`--radius-surface`) and carry corner marks by default. See
[Card](card.md#corner-marks) for the shared panel contract.
Entry/exit uses `--motion-duration-normal` and `--motion-easing-standard`, with
no travel under reduced motion.

## Variants

Two placements: bottom (default for small-viewport task adaptation) and side
for contextual detail or editing. Placement must not change Dialog semantics or
the task's accessible name.

## Sizes

One responsive size per placement. Content is bounded by the viewport and the
host layout; do not introduce `sm` / `md` / `lg` Drawer widths.

## States

| State | Behavior |
| --- | --- |
| closed (default) | Content is absent; trigger remains available. |
| hover | Trigger and child controls own hover. |
| focus | Opening moves focus inside; focused controls show `--color-focus`. |
| active/open | Page behind is inert and focus is trapped. |
| disabled | Disabled trigger does not open; Drawer itself is not disabled. |
| dragging | Optional touch dismissal follows the pointer and cancels below the component's deliberate threshold. |
| loading/error | Same task behavior as Modal/Dialog; do not dismiss on failure. |

## Accessibility

Use Dialog semantics (`role="dialog"`, `aria-modal="true"`, labelled title),
focus trap, background inertness, and focus return. `Escape` closes when safe;
`Tab` stays inside. Swipe/drag dismissal must have an equivalent Close Button,
must not be the only way out, and must not discard work accidentally.

## Terminal

In a terminal, Drawer is `tui-kiso` `Drawer`: a panel the full height of
the screen, against the right edge by default, over a dimmed page.

| State | Terminal form |
| --- | --- |
| open | `Scrim` over the screen, then an opaque `popover` panel with a half row at the top and the bottom. No border and no shadow. |
| content | Bold title, the body, then the footer: key hints on the left, [buttons](button.md) on the right. Two columns of padding. |
| sizes | 3 grid tracks wide, or 4 with `.tracks(4)`. On a screen narrower than 3 tracks it takes the full width. |
| side | `.side(Side::Left)` puts it against the left edge. |

`Esc` closes it; say so in its hints. Use a drawer for a record's details
next to the list it came from. When the details need more room than 4
tracks, open them as a page in place of the list, and keep the list's
search, filters, selection and scroll for `Esc`. See
[terminal interfaces](../terminal-interfaces.md#layout).

## When to use

- A Modal task that needs a small-viewport, edge-to-edge presentation.
- Contextual detail or editing where retaining the underlying page matters.

## When NOT to use

- Merely because the design wants animation from an edge.
- Primary application navigation that should remain persistent; use Sidebar.
- A short anchored choice; use Popover or DropdownMenu.
- A full workflow that deserves its own route.

## Radix/shadcn mapping

Maps behavior to Radix Dialog and presentation to shadcn Sheet. Keep Dialog
focus management. A gesture-oriented drawer library may supply drag behavior,
but it must preserve these semantics and semantic tokens.
