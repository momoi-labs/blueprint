# AppShell

## Purpose

AppShell places persistent [Sidebar](sidebar.md) navigation beside the main
application content. It owns the page columns, not navigation state.
ApplicationShell composes the standard frame when a product wants the complete
shared chrome — either a console with a rail, or a single-surface top bar.

## Anatomy

Console with rail (default):

```
AppShell
├── Sidebar
└── AppShellMain
    ├── Header or PageHeader (optional)
    └── page content
```

Single-surface top bar (`layout="topbar"`):

```
AppShell[data-layout="topbar"]
└── AppShellMain
    ├── Header (brand, primaryAction, header)
    └── page content
```

The console slots are direct children. AppShell is a `div`; AppShellMain is a
`main` with `min-width: 0`, so wide tables and log lines cannot push the
Sidebar off screen. Sidebar owns its header, body, and footer.

ApplicationShell takes `brand`, optional `primaryAction`, optional `header`,
and page content. The default `layout="sidebar"` also takes navigation groups
and optional `footer`. A destination contains `href`, `label`, optional
`active`, optional `onClick`, and optional leading or trailing content. The
caller still decides the current destination and whether a destination follows
its link or changes a view in place.

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

```tsx
<ApplicationShell
  layout="topbar"
  brand={<ProductBrand />}
  primaryAction={<CreateProject />}
  header={<BoardChrome />}
>
  {page}
</ApplicationShell>
```

When `onClick` is present, ApplicationShell prevents link navigation and calls
it. Without `onClick`, the destination remains a normal link. Use
`navigationLabel` to distinguish this navigation landmark when the default
`Primary` label is not specific enough.

## Variants

`layout="sidebar"` (default) mounts Sidebar with brand and primary action in
SidebarHeader, navigation in SidebarBody, and optional footer. The optional
`header` slot stays in the main column.

`layout="topbar"` omits Sidebar entirely. Brand, optional primary action, and
the optional `header` slot render together in Header. Do not pass `navigation`
or `footer` in this mode — there is no rail to host them.

Compose [Header](header.md) and [PageHeader](page-header.md) inside the main
slot as the page requires when using AppShell directly.

## Sizes

The Sidebar column uses `--size-sidebar`; the main column takes the remaining
width with a zero minimum. The shell has a minimum height of one viewport.
At widths of 1023px or less, a sidebar layout becomes one column and Sidebar is
hidden. The product must provide access to navigation at that width, for
example through a [Drawer](drawer.md).

`layout="topbar"` is a single main column at every width. It does not rely on
the 1023px media query to collapse a sidebar track.

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
- A top-bar layout has no Sidebar navigation landmark; put destinations in the
  Header or elsewhere in the product chrome.

### Keyboard

No shell keymap. Tab follows the controls in DOM order; navigation and Drawer
retain their own keyboard behavior.

## When to use

- An application with persistent navigation beside a changing page.
- A console containing tables, detail panes, and logs in its main column.
- A single-surface product whose chrome is one top bar (`layout="topbar"`).
- Use ApplicationShell when the product follows one of the two standard frames.
- Use AppShell directly when its Sidebar or Header composition differs.

## When NOT to use

- A standalone login or centered form. Use [Card](card.md) within the page.
- Two resizable content panes. Use [Split](split.md) inside the main content.
- Hiding a required rail with CSS. Prefer `layout="topbar"` or AppShell
  composed without Sidebar.

## Radix/shadcn mapping

No dedicated Radix primitive. Compose Sidebar and a semantic main region.
AppShell supplies Kiso's column layout; it does not add a Sidebar provider,
routing, or collapse state.
