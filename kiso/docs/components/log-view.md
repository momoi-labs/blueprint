# LogView

## Purpose

LogView displays log lines in a bounded, scrollable frame and follows new
output while the reader stays at the end. It owns the scroller and follow-tail
behavior; the product owns the log source and any toolbar controls.

## Anatomy

```
LogView (frame)
└── internal scroller
    └── LogViewLine (repeated)
        ├── LogViewTime (optional)
        ├── LogViewLevel (optional)
        └── message
```

Set height on LogView. Its internal scroller takes the available space and
owns overflow. Do not add a second scrolling wrapper around the lines. Root
props target the frame; the ref exposes a handle, not its DOM element.
Time and level slots accept text supplied by the product.

## Variants

LogView has one dark log treatment. LogViewLevel uses `level`, with `info`
(default), `warn`, and `error` mapped to `--color-info-on-dark`,
`--color-warning-on-dark`, and `--color-danger-on-dark`. Include readable level
text such as "WARN"; the component does not generate it from the prop.

## Sizes

No size variants. The product chooses the frame height. The frame uses
`--color-neutral-950`, text `--color-neutral-300`, `--color-border`,
`--radius-surface`, and `--spacing-md` padding. Log text uses `--font-mono`,
`--type-size-label`, and `--type-line-height-relaxed`. Timestamps use
`--color-neutral-600` with `--spacing-sm` after them.

## States

| State | Behavior |
| --- | --- |
| following (initial default) | Changed children scroll to the end before paint. |
| reading older output | Scrolling away from the bottom pauses automatic following. |
| returned to end | Scrolling within 8px of the bottom resumes uncontrolled following. |
| controlled | `follow` determines whether child updates scroll to the end. |

Omit `follow` for internal state. To connect a Follow switch, pass `follow` and
update it in `onFollowChange`. The callback reports whether scrolling reaches
or leaves the bottom; the product must apply that value in controlled mode.
`follow=false` prevents automatic following even at the bottom.

The `LogViewHandle` ref exposes `scrollToBottom(behavior?: ScrollBehavior)`
for a "Jump to end" action. This scrolls the internal element; it does not set
a controlled `follow` value. Turning `follow` on also moves to the end.

The product supplies empty, loading, disconnected, and failed-source states.
A line at `level="error"` describes log content, not a failure of LogView.

## Accessibility

Use an accessible label for the surrounding log region and visible labels for
Follow and Jump to end controls. Keep timestamps and levels readable as text.
LogView does not assign `role="log"`, a live region, or a tab stop by default.
Choose announcement behavior for the task; announcing every line of a busy
stream can overwhelm the reader. Verify keyboard access to the internal
scroller in the target browser. Root props do not configure that scroller.

### Keyboard

No custom keymap. Scrolling uses browser behavior when the scroller is focused.
Follow and Jump to end use their Switch and Button keyboard contracts.

## When to use

- A bounded stream of operational output beside configuration or resource details.
- Log history where readers can pause following by scrolling back.

## When NOT to use

- Unbounded datasets requiring virtualization. LogView renders every supplied
  child; the product must bound retention or choose a virtualized viewer.
- An editable terminal or command input. LogView does not emulate a terminal.
- Search, filtering, parsing, or fetching log data. Those belong to the product.

## Radix/shadcn mapping

No dedicated log primitive. Kiso uses a native internal overflow scroller and
owns follow-tail state. A ScrollArea alone does not provide that behavior or
the `LogViewHandle` contract.
