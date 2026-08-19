# Sidebar

A persistent navigation region for products with several destinations or
collapsible groups.

## Purpose

Sidebar makes a broad product structure scannable without turning the Header
into a menu bar. It is a layout container whose items remain Links; disclosure
controls only expand or collapse sections.

## Anatomy

```
Sidebar
├── label (accessible, may be visually hidden)
├── Navigation
│   ├── Link(s)
│   └── section(s)
│       ├── disclosure Button
│       └── Link(s)
└── collapse control (optional IconButton)
```

Surface uses `--color-surface`, divider `--color-border`, primary text
`--color-foreground`, and current items `--color-primary`. Layout uses
`--spacing-sm` between items, `--spacing-md` section gaps, and the five
property-qualified label typography tokens.

## Variants

No visual variants. Sidebar has one navigation treatment; expanded and
collapsed are states of the same component, not separate variants.

## Sizes

No `sm` / `md` / `lg` sizes. Width belongs to the host layout, and internal
spacing uses semantic tokens without changing Link or disclosure-control sizes.

## States

| State | Behavior |
| --- | --- |
| default | Expanded groups and their current state are visible. |
| hover | Interactive children own hover feedback. |
| focus | Links and disclosure controls show `--color-focus`. |
| active | Current destination has `aria-current="page"`; expanded disclosures have `aria-expanded="true"`. |
| disabled | Sidebar is not disabled; omit unavailable destinations or explain them adjacent to a disabled child. |
| collapsed | Sections reduce to an explicit compact navigation; essential labels must remain available without Tooltip. |

## Accessibility

Wrap the links in a labelled `<nav>`. Use real Buttons with `aria-expanded`
and `aria-controls` for section disclosures. Collapsing the whole Sidebar must
not strand focus in hidden content; move it to the collapse control. Keep DOM
and visual order aligned. `Tab` moves among controls; `Enter`/`Space` toggles a
focused disclosure; Links retain native behavior.

## When to use

- Products with several stable top-level destinations or grouped sections.
- Dense technical tools where persistent wayfinding reduces context switching.

## When NOT to use

- A handful of global destinations that fit in [Header](header.md).
- A hierarchical path to the current page; use [Breadcrumb](breadcrumb.md).
- Temporary controls unrelated to navigation.

## Radix/shadcn mapping

No Radix Sidebar primitive. shadcn Sidebar is a structural reference, but Kiso
keeps native nav/Link semantics and semantic tokens. Disclosure behavior may
use Radix Collapsible / shadcn Collapsible.
