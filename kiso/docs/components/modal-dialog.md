# Modal / Dialog

A focused overlay for a task or decision that temporarily blocks the page.

## Purpose

Modal/Dialog interrupts the current flow only when the person must complete,
confirm, or cancel a focused task before returning. It traps focus and makes
the page behind it inert. On small viewports, content that needs more room may
use [Drawer](drawer.md) instead.

## Anatomy

```
Dialog Root
├── Trigger
├── Overlay
└── Content
    ├── Title (required)
    ├── Description (required when the title is insufficient)
    ├── body
    ├── actions
    └── Close control
```

Content uses `--color-elevated-surface`, `--color-foreground`,
`--color-border`, `--radius-surface`, `--spacing-lg` padding, and
`--shadow-lg`. A Dialog is a panel: it carries corner marks. The scrim uses
`--color-overlay`. Panels are square (`--radius-surface`) and carry corner marks. See
[Card](card.md#corner-marks) for the shared panel contract.
Overlay transitions use `--motion-duration-normal` and
`--motion-easing-standard`.

## Variants

Two behavioral variants: task Dialog (default) and Alert Dialog for a
confirmation that must prevent outside dismissal. Both keep the same labelled,
modal focus behavior; an in-page Alert is not a Dialog variant.

## Sizes

One responsive size. Content uses a readable bounded width and becomes
viewport-limited when space is tight; use Drawer when the task needs a distinct
small-viewport presentation instead of adding `sm` / `lg` Dialog sizes.

## States

| State | Behavior |
| --- | --- |
| closed (default) | Content is absent; trigger remains available. |
| hover | Trigger and child controls own hover. |
| focus | Opening moves focus inside; `--color-focus` remains visible on controls. |
| active/open | Page behind is inert; focus is trapped in Content. |
| disabled | A disabled trigger does not open; the Dialog itself is not disabled. |
| loading | Keep close/cancel available when safe, mark the task `aria-busy="true"`, and prevent duplicate submission. |
| error | Show recoverable error next to the affected action or field; keep the Dialog open. |

## Accessibility

Use `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and when needed
`aria-describedby` (Radix supplies these from Title/Description). Opening moves
focus to the first meaningful element, not always the close icon. `Tab` and
`Shift+Tab` cycle inside; `Escape` closes unless a destructive operation cannot
safely be interrupted. Closing returns focus to the trigger or the next logical
control. Clicking the overlay may close only when losing work is impossible.

## When to use

- A short focused task, confirmation, or decision that blocks page work.
- Content that needs explicit completion or cancellation.

## When NOT to use

- Persistent information; use an in-page [Alert](alert.md).
- A transient confirmation; use [Toast](toast.md).
- Rich contextual content anchored to a control; use [Popover](popover.md).
- Long or navigation-heavy workflows; use a page, or Drawer when viewport
  adaptation is the real need.

## Radix/shadcn mapping

Maps to Radix Dialog / shadcn Dialog (`Root`, `Trigger`, `Portal`, `Overlay`,
`Content`, `Title`, `Description`, `Close`). Use Radix Alert Dialog only for
confirmations that require its stricter outside-dismiss behavior; it is not
Kiso's in-page Alert.
