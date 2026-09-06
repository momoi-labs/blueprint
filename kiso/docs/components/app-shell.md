# AppShell

## Purpose

AppShell places persistent [Sidebar](sidebar.md) navigation beside the main
application content. It owns the page columns, not navigation state.

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

## When NOT to use

- A standalone login or centered form. Use [Card](card.md) within the page.
- Two resizable content panes. Use [Split](split.md) inside the main content.

## Radix/shadcn mapping

No dedicated Radix primitive. Compose Sidebar and a semantic main region.
AppShell supplies Kiso's column layout; it does not add a Sidebar provider,
routing, or collapse state.
