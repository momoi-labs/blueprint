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
`--color-primary`, and `--color-focus`. Items use `--spacing-sm` block and
`--spacing-md` inline spacing plus the five property-qualified label typography
tokens. In a row, the current marker moves on `--motion-duration-fast` and
`--motion-easing-standard`.

## Variants

No visual variants. Navigation is semantic structure and inherits horizontal,
vertical, or other presentation from its Header, Sidebar, footer, or section.

## Sizes

No sizes of its own. The host controls layout and spacing; Links keep the sizes
defined by their component guidance.

## States

| State | Behavior |
| --- | --- |
| default | Destinations are exposed as native Links. |
| hover | Link owns hover feedback. |
| focus | Focused Link shows `--color-focus`. |
| active | Current destination uses `aria-current="page"`. |
| disabled | Navigation is never disabled; omit unavailable destinations or follow Link guidance. |

In a row, when the current destination changes without a page load, its
marker slides along the row's shared edge to the new Link. It moves without
the slide in browsers without CSS anchor positioning, in right-to-left rows,
and under reduced motion. [Sidebar](sidebar.md) describes the column marker.

## Accessibility

Use `<nav aria-label="…">` and preferably a list of Links. Each navigation
landmark on the page needs a distinct label (“Primary”, “Breadcrumb”,
“Pagination”). Do not add menu roles: application navigation keeps native Link
semantics and `Tab` order. `Enter` follows a Link.

## Terminal

In a terminal, Navigation is the list of `SideItem`s inside the `Sidebar`
of `tui-kiso`. There is no second type: the same widget draws the groups,
the selected item, the counts and the disabled state. Read the Sidebar
doc for the states.

A navigation that is not in a sidebar maps to the forms the crate has:
`Tabs` for the views of one screen, `Breadcrumb` for the path, `DropdownMenu`
for the actions of one row, and `KeyHints` for the keys. See
[terminal interfaces](../terminal-interfaces.md).

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
