# ConsoleShell

The frame of a console: a collapsible sidebar, a header with a breadcrumb, an
optional status and an account menu, and one page.

## Purpose

ConsoleShell fixes the choices every console page shares, so each screen
only passes its data. It is an [ApplicationShell](app-shell.md) with
`collapsible`, `togglePlacement="header"`, `phoneNavigation="bottom"`,
`shellLayout` and `headerVariant="default"`. Use ApplicationShell directly when a product needs
other choices.

## Anatomy

```
ConsoleShell
├── Sidebar
│   ├── brand (expanded) or brandMark (collapsed rail)
│   └── navigation groups
├── Header
│   ├── Breadcrumb
│   ├── status (optional)
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
| `status` | node | Optional. A short state, such as a dot and a label, shown in the header directly left of the account menu on every width. |
| `children` | node | The page body. |

```tsx
<ConsoleShell
  brand={<span>Console</span>}
  brandMark={<Database className="icon" aria-hidden="true" />}
  navigation={[{ destinations: [{ href: "/clusters", label: "Clusters", active: true }] }]}
  breadcrumb={[{ label: "Console", href: "/" }, { label: "Clusters" }]}
  account={{ identity: "alex@example.com", theme, onThemeChange: setTheme, onSignOut: signOut }}
  status={<><Dot variant="success" /><span>Healthy</span><span className="muted mono">v0.20.0</span></>}
>
  <ListPage title="Clusters" action={create} state="ready" empty={empty}>{rows}</ListPage>
</ConsoleShell>
```

## States

| State | Behavior |
| --- | --- |
| expanded | Sidebar shows `brand` and labelled destinations. |
| collapsed | The header toggle folds the sidebar to a rail with `brandMark` and icons. |
| phone | Below 1024px the header shows `brandMark`. Below 700px the destinations move to a [BottomNav](bottom-nav.md) and the header has no menu button; with more than five destinations the bar shows four and More. From 700px to 1023px the navigation opens in a Drawer from the menu button. Below 700px a header with `status` truncates the breadcrumb, so keep the status short. |
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
- When the header needs more than a breadcrumb, a status and an account menu;
  compose ApplicationShell.

## Radix/shadcn mapping

No Radix or shadcn equivalent. The account menu uses the Kiso
[Popover](popover.md), which wraps Radix Popover.
