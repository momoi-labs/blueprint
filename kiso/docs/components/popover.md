# Popover

An anchored overlay for rich contextual content, including interactive
controls.

## Purpose

Popover adds context or a small task beside its trigger without blocking the
whole page. Unlike [Tooltip](tooltip.md), it may contain Buttons, Links, or
inputs and can hold more than a short hint.

## Anatomy

```
Popover
├── Trigger
└── Content
    ├── heading/label (when needed)
    ├── contextual content or controls
    └── Arrow (optional)
```

Content uses `--color-elevated-surface`, `--color-foreground`,
`--color-popover`, `--color-border`, `--radius-lg`, `--spacing-md` padding,
and `--shadow-md`. A Popover is transient chrome, not a panel: it keeps a small
radius and carries no corner marks.
Placement offset uses `--spacing-xs`, collision padding uses `--spacing-md`,
and motion uses `--motion-duration-fast` with `--motion-easing-standard`.

## Variants

No visual variants. Side, alignment, collision flipping, and an optional Arrow
are placement/composition options, not separate Popover variants.

## Sizes

One content-sized treatment with a readable maximum width. Do not add named
sizes; content that needs substantially more room belongs in Dialog or Drawer.

## States

| State | Behavior |
| --- | --- |
| closed (default) | Content is absent and trigger has `aria-expanded="false"`. |
| hover | Trigger owns hover; hover alone does not open interactive content. |
| focus | Trigger/children show `--color-focus`; opening may move focus to content when the task requires it. |
| active/open | Trigger has `aria-expanded="true"`; Content flips or shifts on collision. |
| disabled | Disabled trigger does not open. |
| loading/error | Represent these inside Content with the relevant component; keep the Popover stable. |

## Accessibility

The trigger is a Button or other appropriate control with `aria-expanded` and
an accessible name. `Enter`/`Space` opens; `Escape` closes and returns focus to
the trigger. `Tab` moves through interactive content and then onward; Popover
does not trap focus like a Dialog. Close on outside interaction only when doing
so cannot lose unsaved work. Supply a heading/label when Content needs one.

## When to use

- Contextual details, filters, compact forms, or rich previews anchored to a
  control.
- Content with interactive elements that cannot live in Tooltip.

## When NOT to use

- A short, non-essential text hint; use Tooltip.
- A blocking decision or focus trap; use Modal/Dialog.
- A list of actions only; use DropdownMenu.
- Essential information that disappears without a clear way to reopen it.

## Radix/shadcn mapping

Maps to Radix Popover / shadcn Popover (`Root`, `Trigger`, `Portal`, `Content`,
optional `Arrow`). Radix collision and focus behavior are the behavioral
reference; restyle with Kiso tokens.
