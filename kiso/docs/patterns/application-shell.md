# Application shell

The persistent skeleton of every authenticated Momoi product: Header, Sidebar,
and a main content region. Page-level patterns (list-detail, CRUD, dashboard,
settings) render inside main — they do not reinvent chrome.

User story #28.

## Purpose

Give every product the same wayfinding frame so people always know where they
are and how to reach another destination. The shell owns product identity,
primary destinations, and global actions. It does not own page titles, page
actions, or collection behavior.

## Component composition

| Region | Compose with | Role |
| --- | --- | --- |
| Top chrome | [Header](../components/header.md) | Brand/home [Link](../components/link.md), optional primary [Navigation](../components/navigation.md), global [IconButton](../components/icon-button.md) / [DropdownMenu](../components/dropdown-menu.md) |
| Scope | [ScopeSwitcher](../components/scope-switcher.md) in Header | Optional: the organization, project or resource the app works in, one switcher per level. See [Scope in Header](#scope-in-header). |
| Side chrome | [Sidebar](../components/sidebar.md) | Persistent product destinations via Navigation Links; optional collapse [IconButton](../components/icon-button.md) |
| Main | page content | Routed page patterns; starts with [PageHeader](../components/page-header.md) unless the page pattern specifies otherwise |
| Phone chrome | [BottomNav](../components/bottom-nav.md) | Optional: the same primary destinations in a bar at the bottom edge below 700px |
| Global jump | [CommandPalette](../components/command-palette.md) | Optional app-wide search/actions; triggered from Header or keyboard — not a Sidebar substitute |

Do not place page-scoped create/edit Buttons in Header. Those belong in
PageHeader or the page pattern. Do not nest a second Header or Sidebar inside
main.

Tokens: shell surfaces use `--color-background` for the canvas,
`--color-surface` and `--color-border` for Header/Sidebar, and
`--color-foreground` / `--color-primary` for chrome text and current
destinations. Focus rings use `--color-focus`.

## Flow

1. Person lands on an authenticated route.
2. Shell renders Header + Sidebar + main; Sidebar marks the current destination
   with `aria-current="page"`.
3. Main loads the page pattern for the route (for example list-detail).
4. Navigating a Sidebar or Header Link swaps only main content; chrome stays
   mounted unless the destination leaves the authenticated app (for example
   sign-out → [login/authentication](login-authentication.md)).
5. Narrow viewports: Sidebar collapses per its component contract; Header keeps
   brand/home and essential global actions. A scope switcher collapses to
   one compact trigger that still reaches every level. A product with three to five
   primary destinations can move them to BottomNav on phones instead. An
   inset frame meets the screen edges below 700px.

## Scope in Header

A product whose pages work inside nested scopes, such as organization,
project and server, shows them in Header with a
[ScopeSwitcher](../components/scope-switcher.md), right after the brand.
Sidebar keeps the pages of the current scope. Pages drop their own scope
Selects and keep only their filters.

- **The URL holds the scope.** Use a path segment for a hard boundary, such
  as separate data or billing. Use a query param, such as `?project=`, for a
  scope people compare across. An "All" choice is an explicit value in the
  URL, not a missing one.
- **A switch keeps the page.** After a switch, stay on the same page in the
  new scope when it exists there. Otherwise go to the front page of the new
  scope. Do not send people to an overview on every switch.
- **Deeper levels follow.** Changing a level resets each level below it to
  its "All" choice, or to its default when it has no "All".
- **History.** Every switch is a new history entry, so Back returns to the
  earlier scope. Fixing an invalid or remembered scope replaces the entry
  instead, so Back does not loop.
- **Page filters stay.** A scope change keeps the page's own filters, such as
  time range or search, unless they are invalid in the new scope.
- **No hidden scope.** A remembered scope must always show in Header. Do not
  narrow a page by a scope the person cannot see.
- **Pages that do not use a level** omit that segment. An org-level page,
  such as Projects or account settings, shows only the organization.
- **Errors.** The switcher loads its own data. When the page's data fails,
  the switcher still works, so the person can leave the broken scope.

## States

| State | Behavior |
| --- | --- |
| default | Header, Sidebar, and main are visible; current nav item is marked. |
| loading (main) | Chrome stays; main shows the page pattern's loading treatment (usually [Skeleton](../components/skeleton.md) for known layout). Do not replace the whole shell with a full-page [Spinner](../components/spinner.md). |
| empty (main) | Chrome stays; the page pattern owns [EmptyState](../components/empty-state.md) inside main. |
| error (main) | Chrome stays; the page pattern shows [Alert](../components/alert.md) (what / why / now per [voice-and-tone](../voice-and-tone.md)). Shell navigation and the scope switcher remain usable so the person can leave the broken view. |
| Sidebar collapsed | Compact navigation per the Sidebar contract. |
| unauthorized route | Prefer redirect or an in-main explanation of what is blocked; do not silently strip Sidebar destinations without explanation. |

## Layout sketch

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Header                                                               │
│ [Brand] Acme ▾ / Checkout ▾ / db-prod-01 ▾      [⌘K] [?] [Account ▾] │
├────────────────┬─────────────────────────────────────────────────────┤
│ Sidebar        │ Main                                                │
│                │ ┌─────────────────────────────────────────────────┐ │
│  Overview      │ │ PageHeader                                      │ │
│  Connections ● │ │ Title                          [Primary Button] │ │
│  Queries       │ └─────────────────────────────────────────────────┘ │
│  Settings      │                                                     │
│                │   (page pattern: list-detail / CRUD / dashboard /   │
│                │    settings — not shell chrome)                     │
│                │                                                     │
│                │   --color-background canvas                         │
│                │   content on --color-surface as the page needs      │
└────────────────┴─────────────────────────────────────────────────────┘
```

Narrow viewport (Sidebar collapsed):

```text
┌────────────────────────────────────────┐
│ Header  [Brand] ≡ db-p… ▾ [☰] [Account] │
├────────────────────────────────────────┤
│ Main                                   │
│  PageHeader + page pattern             │
└────────────────────────────────────────┘
```

## When to use

- Every authenticated Momoi product screen that participates in primary
  product navigation.

## When NOT to use

- Pre-auth screens ([login/authentication](login-authentication.md)) — no
  product Sidebar.
- Focused full-bleed tasks that intentionally leave product chrome (rare;
  document the exception).
- Marketing or docs sites outside the product shell.

## Related patterns

- [List-detail](list-detail.md), [CRUD](crud.md), [Dashboard](dashboard.md),
  [Settings](settings.md) — render inside main.
- [Login / authentication](login-authentication.md) — outside this shell.
