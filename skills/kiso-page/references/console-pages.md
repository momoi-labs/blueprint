# Console page standard

Applies to list, detail and create screens of a console built on Kiso. It
sits on top of the pattern files in `kiso/docs/patterns/`. Where a pattern
file and this standard disagree, this standard wins for the console. Record
a project's exceptions in its `docs/kiso.md`.

## Use the components

The console template lives in `@momoi-labs/kiso-react`. A screen fills
slots. It does not paste CSS or rebuild the shell.

| Part | Component | Needs |
| --- | --- | --- |
| Shell | `ConsoleShell` | kiso and kiso-react releases after 1.10.0 and 0.32.0 |
| List screen | `ListPage` | same |
| Create and edit screens | `FormPage` | same |
| Detail screen | `DetailPage` | same |

On an older release, upgrade first. Do not copy the CSS into the product: it
ships in `ui.css` now.

```tsx
<ConsoleShell
  brand={<Lockup />}
  brandMark={<Symbol />}
  navigation={groups}
  breadcrumb={[{ label: "Console", href: "/" }, { label: "Clusters" }]}
  account={{ identity: email, theme, onThemeChange, onSignOut, href: "/account", language }}
>
  <ListPage title="Clusters" action={{ label: "Create cluster", href: "/clusters/new" }}
    state={rows.length ? "ready" : "empty"} empty={{ title: "No clusters yet" }}
    filters={<div className="list-filters">…</div>} count="3 of 3 clusters">
    <TableHeader>…</TableHeader><TableBody>…</TableBody>
  </ListPage>
</ConsoleShell>
```

`ConsoleShell` renders the one `.page`. A screen never adds its own.

## Every screen

- The header is the title on the left and the page's primary action on the
  right. Pass the action as `action`. One action, one place: no second copy
  in an empty state, a tab or a step list.
- The action shows even when there is no data. Never disabled: hide what the
  user cannot do yet.
- No `PageHeaderDescription`. The sidebar and breadcrumb already say where
  the user is. No subtitle, no hint under a field, no muted sentence beside
  an action.
- Empty state text: a short title and at most one short sentence. No button
  inside.

## Layouts

Every screen takes `width`: `left`, `center`, `right` or `full`. The
PageHeader joins the content in one box, so the title starts at the box's
start edge and the action ends at its end edge.

| Screen | Default | Box |
| --- | --- | --- |
| List (`ListPage`) | `full` | at most 880 px for `left`, `center`, `right` |
| Detail (`DetailPage`) | `full` | at most 880 px for `left`, `center`, `right` |
| Form (`FormPage`) | `left` | at most 720 px for `left`, `center`, `right` |

`full` is the page width. Below 880 px of page (720 px for a form) every value
gives the page width, so at 390 px every block has a 24 px margin on both
sides. Use the same value on every screen of one product unless a row in
`docs/kiso.md` says otherwise.

## List screen

- `ListPage` with `state`: `loading`, `empty` or `ready`.
- Ready: header, then `filters`, then the table, which ends with its last row,
  with `count` in its footer. Pass `fill` only for a list that opens a record
  beside it.
- Empty: header and one Card with the EmptyState, edge to edge. No filters,
  no table, no table header.
- A filter that empties a non-empty list is a different case: keep the table
  and show a "No things match your filters." row.

## Detail screen

- `DetailPage` with `title`, an optional `action` and `tabs`. One
  `.detail-tabs` Card. No nested Card around a tab.
- A tab with nothing to show takes `empty: { title, text }`. It renders the
  same edge-to-edge EmptyState as an empty list. A table with no rows is
  replaced by the empty state, not shown with an empty body.
- A tab whose only content is a table uses `<TableFrame frame="none">`. It
  reaches the Card's edges.
- Control the open tab with `value` and `onValueChange` when the route holds
  it.

## Form (create screen, edit screen, account)

- `FormPage` with `mode="create"` (Cancel and the verb) or `mode="edit"`
  (Discard only when `dirty`, Save disabled until there is a change).
- Pass the fields as children. `FormPage` writes `.form-body` and a sticky
  `FormActions` with `tone` and `message`.
- A read-only field gets no `hint`.

## Shell

`ConsoleShell` sets `collapsible`, `togglePlacement="header"`, `shellLayout`
and `headerVariant="default"` on `ApplicationShell`. It draws the accent bar
with the `--color-accent-surface` fill and the 2 px `--color-primary` stripe, keeps the nav icons in place when the
sidebar collapses, shows only `brandMark` in the phone header, hides every
breadcrumb item but the last below 700 px, and opens the account Popover:
identity, the account link when `href` is set, ThemeSelector, `language`
when set, Sign out.

- The sidebar lists pages, not records. A detail screen marks its list page
  with `active`. Settings is the last nav group.
- Header, left to right: sidebar toggle, breadcrumb, a spacer, the account
  button.

### Logo and brand bar

The product owns two drawings. Kiso places them.

| Prop | What the product passes | Rule |
| --- | --- | --- |
| `brandMark` | The symbol, `--size-control-sm` (32 px) square | Same drawing in the open sidebar, the rail and the phone header. Size it with the token, never with a pixel value. |
| `brand` | The lockup: the symbol and the name, or one lockup drawing | At most 32 px tall. Its left edge is the brand inset and its centre sits on the bar centre. |

Do not add product CSS for `.sidebar-header`, `.topbar`, the stripe, the bar
fill, the brand inset or the nav icon padding. Kiso sets them. A product rule
there is drift.

## Measured values

Measured on the blueprint prototype, Kiso light and dark, 1280 px and
390 px. A difference in a product is a bug or an exception row.

| Value | Spec |
| --- | --- |
| Header band and sidebar bar | 60 px each, bottoms aligned, expanded and collapsed |
| Stripe | 3 px, `--color-primary`, inset shadow above the 1 px line |
| Symbol | 32 x 32, centre x 33.5 and centre y 28, expanded and collapsed |
| Lockup | left edge 17.5 (the brand inset) |
| Rail | 68 px wide. Nav icon centre x 33.5, open and collapsed |
| Phone header | 60 px, symbol only, no stripe, no sideways scroll |
| Header top | 84 px (60 band + 24 page padding) |
| Title top | 86.8 px, with or without an action |
| First block top | 140 px on every screen |
| `.page` count | 1 |
| Margins at 390 px | 24 px on both sides of every block |

## Check before you say it is done

Run `@momoi-labs/kiso-check`. Each mode exits 1 on a finding or a failed
measurement. Its README lists every option.

```sh
npx @momoi-labs/kiso-check <source folder>
npx @momoi-labs/kiso-check --cases <file> --base <url>
npx @momoi-labs/kiso-check --url list:full=<url> --url form:left=<url> --url detail:full=<url>
```

Static mode reads the sources. It reports the kiso versions, the shell and
page components each screen uses, product CSS that Kiso ships, a second
`.page`, `PageHeaderDescription`, a button in an empty state and a disabled
header action. Each finding has an id from the kiso-audit checks and a
`file:line`.

Live mode needs Playwright and Chromium: run it from a project that has
them, or set `KISO_PLAYWRIGHT_FROM` to a folder whose `node_modules` has
playwright. It runs four measurements:

- `brand` measures the bar, the stripe, the symbol, the lockup and the nav
  icons at 1280 px expanded and collapsed and at 390 px, and the title and
  first block of a list and a screen without a header action.
- `jump` reads the title top and the first block top of every page. They
  must be equal, with one `.page`.
- `layouts` checks the box for the layout each case names: header top and
  height, first block top, the start and end edges, the 880 or 720 px limit.
- `margins` checks the page edges, the 24 px margins at 390 px and sideways
  scroll.

A cases file has one case per line: `<kind> <layout> <url> [action]`. An
action that starts with `#` sets `location.hash` after load. Any other action
is a selector to click. The blueprint prototype's cases are in
`kiso/blocks/react-prototype/console-cases.txt`.

Then check by hand:

1. Open each list with and without data, and every tab of a detail screen.
2. Tab from the account button reaches the theme selector, the language, then
   Sign out. Escape closes the popover and returns focus to the button.
3. The list page stays marked in the sidebar on its detail screen.
4. For an area that needs a password you do not have, stub its API calls in
   the page and measure the same way.
