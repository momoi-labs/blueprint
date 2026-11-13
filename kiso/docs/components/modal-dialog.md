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
`--color-overlay`. Panels are square (`--radius-surface`) and carry corner marks by default. See
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

Two exceptions fill the viewport less `--spacing-lg`, and edge to edge at
640 pixels and below:

- An expanded [DashboardPanel](dashboard-grid.md#expand) shows one panel in
  detail.
- A screen preview, such as a template in the Kiso gallery, shows a whole
  screen at a size a person can read, with its code and the components it
  uses.

Both show content rather than a task, keep every Dialog behavior, and are
not a size products may pick for other content.

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

## Terminal

In a terminal, Modal is `tui-kiso` `Modal`: a dialog centered on the
overlay surface over a dimmed page. `tui-kiso` `Scrim` dims the page first,
and the dialog owns every cell it covers.

| State | Terminal form |
| --- | --- |
| open | `Scrim` over the screen: in truecolor each cell blends toward `background`; in 256 colors the text turns `subtle-foreground`. The dialog is an opaque `popover` fill with a half row above and below, square, with no border and no shadow. |
| content | Bold title, a blank row, the body, then the footer: key hints on the left, [buttons](button.md) on the right. Three columns of padding at the sides. |
| sizes | `Sm`, `Md` and `Lg` take 3, 4 and 6 grid tracks, never closer than two cells to the screen edge. With no size, the dialog takes the smallest that fits. |
| focus | The focused button carries its focus bars. Focus starts on the safe answer. |

`Esc` closes the dialog; say so in its hints. `←` `→` move between the
buttons, and each button's first letter takes it. `tui-kiso` `Question`
lays out a question in the same dialog: facts, a block on `card` with what
will happen, then the buttons. Help opens with `?` or `F1`, and the theme
picker, the filter editor and the command palette use the same layer. Use
a dialog for one decision or a short form; open a page for anything longer.
See [terminal interfaces](../terminal-interfaces.md).

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
