# Toast

A transient system notification that confirms an outcome without blocking the
current task.

## Purpose

Toast reports brief, non-essential outcomes such as “Copied” or “Saved”. It is
time-limited and appears outside page flow. [Alert](alert.md) is persistent,
in-page, and appropriate when the condition or recovery must remain visible.

## Anatomy

```
Toast Provider
├── Viewport
└── Toast
    ├── Title (required)
    ├── Description (optional)
    ├── Action (optional)
    └── Dismiss (optional IconButton)
```

Use `--color-elevated-surface`, `--color-foreground`,
`--color-muted-foreground`, `--color-border`, `--color-info`, `--color-success`,
`--color-warning`, or `--color-danger` where severity must be shown;
`--spacing-md` padding; `--spacing-sm` gap; `--radius-md`; and `--shadow-md`.

## Variants

Four semantic variants: `neutral` (default), `success`, `warning`, and `error`.
Status variants change the announcement urgency and semantic accent only; they
do not turn the whole Toast into a status-colored surface.

## Sizes

One compact size. Toast has no `sm` / `lg` scales; title, optional description,
and at most one Action must remain brief enough for the standard treatment.

## States

| State | Behavior |
| --- | --- |
| closed (default) | Not present in the viewport. |
| open | Visible long enough to read; polite announcement for normal notices. |
| hover/focus | Pause auto-dismiss while pointer or keyboard focus is within. |
| active | Action runs once; dismiss follows when appropriate. |
| disabled | Toast is never disabled; an unavailable Action follows Button rules. |
| loading | Do not toast indefinite progress; show progress in the initiating region. |
| error | Only for brief, already recoverable failures; persistent/blocking errors are Alert. |

## Accessibility

Use a managed live region: `role="status"` / polite for ordinary outcomes and
assertive announcement only for urgent errors. Do not move focus to a newly
appearing Toast. `F8` may move focus to the Toast viewport (Radix convention);
`Tab` reaches Action/Dismiss after focus enters it; `Escape` dismisses. Pause
the timer on hover, focus, and page blur. Never make Toast the only copy of an
essential error, completed record, or required recovery step.

## When to use

- Brief confirmation of a completed, non-blocking action.
- A background event whose details remain available elsewhere.
- An optional undo action that is also recoverable through normal product UI.

## When NOT to use

- A condition that must remain visible or blocks progress; use Alert.
- Field validation; use ValidationMessage.
- A confirmation that requires a decision; use Modal/Dialog.
- Long content, multiple actions, or ongoing progress.

## Radix/shadcn mapping

Behavior maps to Radix Toast (`Provider`, `Viewport`, `Root`, `Title`,
`Description`, `Action`, `Close`). shadcn currently recommends Sonner; it is
acceptable when configured to preserve the live-region, pause, keyboard, and
semantic-token rules above. Do not copy library hard-coded colors or timing
values.
