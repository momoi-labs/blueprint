# ConsoleShell

The frame of a console: a collapsible sidebar, a header with a breadcrumb and
an account menu, and one page.

## Purpose

ConsoleShell fixes the choices every console page shares, so each screen
only passes its data. It is an [ApplicationShell](app-shell.md) with
`collapsible`, `togglePlacement="header"`, `shellLayout` and
`headerVariant="default"`. Use ApplicationShell directly when a product needs
other choices.

## Anatomy

```
ConsoleShell
├── Sidebar
│   ├── brand (expanded) or brandMark (collapsed rail)
│   └── navigation groups
├── Header
│   ├── Breadcrumb
│   └── account menu (Popover)
│       ├── identity
│       ├── Account link (optional)
│       ├── ThemeSelector
│       ├── language (optional)
│       └── Sign out
└── .page
    └── children
```

The shell renders `.page` around its children. Pass a page body such as
[ListPage](list-page.md), [FormPage](form-page.md) or
[DetailPage](detail-page.md), never a second `.page`.

## Props

| Prop | Type | Use |
| --- | --- | --- |
| `brand` | node | Product name shown in the expanded sidebar. |
| `brandMark` | node | Symbol shown in the collapsed rail and on phones. |
| `navigation` | `ApplicationShellGroup[]` | Sidebar groups and destinations. |
| `navigationLabel` | string | Accessible name of the navigation. Defaults to `Primary`. |
| `breadcrumb` | `ConsoleCrumb[]` | `{ label, href?, onClick? }`. The last item is the current page. |
| `account` | `ConsoleAccount` | `identity`, `theme`, `onThemeChange`, `onSignOut`, optional `href` and `language`. |
| `children` | node | The page body. |

```tsx
<ConsoleShell
  brand={<span>Console</span>}
  brandMark={<Database className="icon" aria-hidden="true" />}
  navigation={[{ destinations: [{ href: "/clusters", label: "Clusters", active: true }] }]}
  breadcrumb={[{ label: "Console", href: "/" }, { label: "Clusters" }]}
  account={{ identity: "alex@example.com", theme, onThemeChange: setTheme, onSignOut: signOut }}
>
  <ListPage title="Clusters" action={create} state="ready" empty={empty}>{rows}</ListPage>
</ConsoleShell>
```

## States

| State | Behavior |
| --- | --- |
| expanded | Sidebar shows `brand` and labelled destinations. |
| collapsed | The header toggle folds the sidebar to a rail with `brandMark` and icons. |
| phone | Below 1024px the navigation opens in a Drawer and the header shows `brandMark`. |
| account open | The Popover lists identity, theme and Sign out. Escape closes it and returns focus to the trigger. |

## Accessibility

The breadcrumb marks the last item with `aria-current="page"`. A crumb
without `href` renders as text. The account trigger is an icon button named
Account. Keep one `<h1>` in the page body; the shell adds none.

## When to use

- For a console where every screen shares the sidebar, the breadcrumb and the
  account menu.

## When NOT to use

- For a top-bar product or a site; use [ApplicationShell](app-shell.md) with
  `layout="topbar"` or a site pattern.
- When the header needs more than a breadcrumb and an account menu; compose
  ApplicationShell.

## Radix/shadcn mapping

No Radix or shadcn equivalent. The account menu uses the Kiso
[Popover](popover.md), which wraps Radix Popover.
