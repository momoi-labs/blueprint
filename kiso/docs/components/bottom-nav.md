# BottomNav

A phone's main destinations in a bar fixed to the bottom edge of the screen.

## Purpose

BottomNav puts three to five top-level destinations within thumb reach on a
phone, as native apps do. It shows only below 700px wide. Wider screens keep
the same destinations in [Header](header.md) or [Sidebar](sidebar.md), and
the bar does not render there.

## Anatomy

```
BottomNav (nav, accessible label)
└── list
    └── BottomNavLink (one per destination)
        ├── icon
        ├── short label
        └── BottomNavBadge (optional count)
```

An ApplicationShell with a sidebar builds the bar from its navigation groups
with `phoneNavigation="bottom"`; see [AppShell](app-shell.md#phone-navigation).
With `layout="topbar"`, pass the bar to the `bottomNav` slot. With AppShell
laid out by hand, place it as a direct child of AppShell after AppShellMain.
In each case the shell adds bottom padding equal to the bar's height plus
`env(safe-area-inset-bottom)`, so the last content of a long page scrolls
clear of the bar.

```tsx
<ApplicationShell
  layout="topbar"
  brand={<ProductBrand />}
  header={<ContractTabs />}
  bottomNav={
    <BottomNav aria-label="Primary">
      <BottomNavLink href="/new" active={tab === "new"}>
        <Plus className="icon" aria-hidden="true" />
        <span>New</span>
      </BottomNavLink>
      <BottomNavLink href="/drafts" active={tab === "drafts"}>
        <Pencil className="icon" aria-hidden="true" />
        <span>Drafts</span>
        <BottomNavBadge>{drafts.length}</BottomNavBadge>
      </BottomNavLink>
    </BottomNav>
  }
>
  {page}
</ApplicationShell>
```

Like NavigationLink, BottomNavLink takes `active` and `asChild`. The product
decides the current destination, and `asChild` keeps a router's own link.

## Variants

No variants. The bar uses `--color-background` and a `--color-border` top
edge. Links use `--color-muted-foreground`. The current link uses
`--color-selected-foreground` and a 2px marker on the bar's top edge, the
edge it shares with its siblings, as in Sidebar. The badge uses
`--color-primary` and `--color-primary-foreground`.

## Sizes

Each link is `--size-touch-min` plus `--spacing-sm` tall and takes an equal
share of the width. The label uses `--type-size-label` on one line. Keep
labels to one or two short words: at 390px, four destinations leave about 90px
each, and a longer label is cut with an ellipsis. Below 700px the bar is fixed
to the bottom with `env(safe-area-inset-bottom)` padding. At 700px and wider
it has `display: none`.

## States

| State | Behavior |
| --- | --- |
| default | Destinations are native links. |
| hover | The link takes `--color-accent-surface-hover`. |
| focus | The focused link shows the standard focus ring. |
| active | The current link has `aria-current="page"` and the top marker. |
| disabled | Not supported. Leave out unavailable destinations. |

## Accessibility

- Give the bar a label with `aria-label`. When the header or sidebar carries
  the same destinations, use the same label: only one of them shows at a
  time.
- Mark icons `aria-hidden="true"` and keep a visible text label. An icon alone
  is not a name.
- A count in BottomNavBadge is part of the link's name ("Drafts 3"). Use a
  visually hidden suffix when the number needs a word, such as "3 open".
- Tab reaches the bar after the page content, in DOM order.

## When to use

- A product whose phone layout puts its main destinations at the bottom edge.
- Three to five destinations of equal weight.

## When NOT to use

- More than five destinations in a hand-built bar. ApplicationShell's
  `phoneNavigation="bottom"` moves the extra ones behind More; otherwise use
  Sidebar.
- Actions, such as "Create". Use a Button in the page or the header.
- Tabs that switch panels within one page. Use [Tabs](tabs.md).

## Radix/shadcn mapping

No primitive. BottomNav is a native `<nav>` with a list of links.
