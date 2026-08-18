# PageHeader

Introduces one page with its title, supporting context, and primary actions.

## Purpose

PageHeader gives every route a clear content heading and a predictable place
for page-scoped actions. It composes title + optional subtitle + action
[Buttons](button.md); it is distinct from the application [Header](header.md).

## Anatomy

```
PageHeader
├── title (required h1)
├── subtitle (optional)
└── actions (optional)
    └── Button(s)
```

Title uses the page-heading semantic type role and `--color-foreground`;
subtitle uses `--color-muted-foreground`. Layout and gaps use semantic spacing
tokens. Actions retain Button tokens and behavior.

## States

| State | Behavior |
| --- | --- |
| default | Title leads; subtitle and actions support it. |
| hover | No container hover; Buttons own hover. |
| focus | Focus lands on actions, never on the layout container by default. |
| active | N/A for the container; child Buttons own active state. |
| disabled | PageHeader is never disabled; individual actions may be. |
| compact | On narrow viewports, actions wrap below text without changing reading or focus order. |

## Accessibility

Use the page's single `<h1>` for the title. Keep DOM order title, subtitle,
then actions even when visual layout places actions beside the title. Button
labels must state their actions. Do not put navigation controls here merely to
fill space.

## When to use

- At the start of a routed page or a primary workspace view.
- When page-specific actions need a consistent location.

## When NOT to use

- For global product chrome; use Header.
- Inside every Card or nested section; use the correct heading level.
- When it would create a second `<h1>` on the page.

## Radix/shadcn mapping

No Radix or shadcn PageHeader primitive. Compose semantic HTML and Kiso Button;
do not treat shadcn CardHeader as a page-level substitute.
