# AppShell

## Purpose

AppShell places persistent [Sidebar](sidebar.md) navigation beside the main
application content. It owns the page columns, not navigation state.
ApplicationShell composes the standard Sidebar, Navigation, Header, and main
column when a product wants the complete frame.

## Anatomy

```
AppShell
├── Sidebar
└── AppShellMain
    ├── Header or PageHeader (optional)
    └── page content
```

The two slots are direct children. AppShell is a `div`; AppShellMain is a
`main` with `min-width: 0`, so wide tables and log lines cannot push the
Sidebar off screen. Sidebar owns its header, body, and footer.

ApplicationShell takes `brand`, optional `primaryAction`, navigation groups,
optional `footer`, optional `header`, and page content. A destination contains
`href`, `label`, optional `active`, optional `onClick`, and optional leading or
trailing content. The caller still decides the current destination and whether
a destination follows its link or changes a view in place.

```tsx
<ApplicationShell
  brand={<ProductBrand />}
  navigation={[{
    label: "Applications",
    destinations: apps.map((app) => ({
      href: `#app-${app.id}`,
      label: app.name,
      active: app.id === currentId,
      onClick: () => open(app.id),
    })),
  }]}
  header={<CurrentLocation />}
  footer={<ProductSettings />}
>
  {page}
</ApplicationShell>
```

When `onClick` is present, ApplicationShell prevents link navigation and calls
it. Without `onClick`, the destination remains a normal link. Use
`navigationLabel` to distinguish this navigation landmark when the default
`Primary` label is not specific enough.

## Variants

One layout. No variant prop. Compose [Header](header.md) and
[PageHeader](page-header.md) inside the main slot as the page requires.

## Sizes

The Sidebar column uses `--size-sidebar`; the main column takes the remaining
width with a zero minimum. The shell has a minimum height of one viewport.
At widths of 1023px or less, the layout becomes one column and Sidebar is
hidden. The product must provide access to navigation at that width, for
example through a [Drawer](drawer.md).

## States

The shell stays in place while page content loads, fails, or becomes empty.
Those states belong inside AppShellMain. There is no disabled or active shell.

## Accessibility

- Use one main landmark for the page. Do not nest another `main` inside
  AppShellMain.
- Give the Sidebar's navigation an accessible name and provide a skip link to
  the main content.
- Keep navigation available when the Sidebar is hidden. AppShell does not
  create a mobile menu or manage its focus.

### Keyboard

No shell keymap. Tab follows the controls in DOM order; navigation and Drawer
retain their own keyboard behavior.

## When to use

- An application with persistent navigation beside a changing page.
- A console containing tables, detail panes, and logs in its main column.
- Use ApplicationShell when the product follows the standard complete frame.
- Use AppShell directly when its Sidebar or Header composition differs.

## When NOT to use

- A standalone login or centered form. Use [Card](card.md) within the page.
- Two resizable content panes. Use [Split](split.md) inside the main content.

## Radix/shadcn mapping

No dedicated Radix primitive. Compose Sidebar and a semantic main region.
AppShell supplies Kiso's column layout; it does not add a Sidebar provider,
routing, or collapse state.
