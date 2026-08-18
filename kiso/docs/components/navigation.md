# Navigation

A semantic container for a coherent set of Links to major destinations.

## Purpose

Navigation supplies landmark and grouping semantics without choosing a layout.
[Header](header.md) and [Sidebar](sidebar.md) are specific layout roles that
compose Navigation; Navigation itself is not a visual menu or overlay.

## Anatomy

```
Navigation
├── accessible label
└── list
    └── Link(s)
```

Presentation inherits its host. Links use `--color-foreground`,
`--color-primary`, and `--color-focus`; spacing and type use semantic tokens.

## States

| State | Behavior |
| --- | --- |
| default | Destinations are exposed as native Links. |
| hover | Link owns hover feedback. |
| focus | Focused Link shows `--color-focus`. |
| active | Current destination uses `aria-current="page"`. |
| disabled | Navigation is never disabled; omit unavailable destinations or follow Link guidance. |

## Accessibility

Use `<nav aria-label="…">` and preferably a list of Links. Each navigation
landmark on the page needs a distinct label (“Primary”, “Breadcrumb”,
“Pagination”). Do not add menu roles: application navigation keeps native Link
semantics and `Tab` order. `Enter` follows a Link.

## When to use

- To group destinations in Header, Sidebar, footer, or a local section.
- When assistive-technology users should be able to jump to the link set as a
  landmark.

## When NOT to use

- A group of commands or Buttons.
- Tabs that switch within-page panels.
- Breadcrumb or Pagination, which need their more specific labels and rules.

## Radix/shadcn mapping

No primitive is needed: use native `<nav>` + list + Kiso Link. Radix Navigation
Menu / shadcn Navigation Menu is only a behavioral reference for genuinely
compound disclosure navigation, not the default implementation.
