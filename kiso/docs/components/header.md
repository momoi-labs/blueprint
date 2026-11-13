# Header

Application-level chrome that keeps primary navigation and global actions in a
predictable place. Header is a layout container, not a primitive.

## Purpose

Header orients the person and exposes a small set of destinations and actions
that remain useful across routes. It composes [Link](link.md) for navigation,
[IconButton](icon-button.md) for icon-only actions, and optionally
[DropdownMenu](dropdown-menu.md) for overflow. A product with nested scopes
adds a [ScopeSwitcher](scope-switcher.md) after the brand. Do not replace
those controls with clickable containers.

## Anatomy

```
Header
├── brand/home Link
├── ScopeSwitcher (optional; org / project / resource)
├── primary Navigation
│   └── Link(s)
└── actions
    ├── IconButton(s)
    └── DropdownMenu (optional, triggered by IconButton)
```

Use `--color-surface`, `--color-foreground`, and `--color-border`;
`--spacing-md` block and `--spacing-lg` inline padding; `--spacing-md` item
gaps; the five property-qualified label typography tokens; `--radius-md` for
interactive children; `--motion-duration-fast`; and
`--motion-easing-standard`. The current Link
uses `aria-current="page"` and `--color-primary`.

## Variants

`default` keeps the surface fill and separator. `variant="plain"` removes
the fill and separator while preserving layout, landmarks and focus.
`variant="floating"` detaches the bar from the page edges with a margin,
rounded corners, and a contact shadow, and stays pinned below the viewport
top while content scrolls behind it. ApplicationShell exposes this choice
through `headerVariant`, in both layouts.

A floating Header follows `data-shadow-style` like a panel: `hard` and `soft`
replace the contact shadow with the panel cast, on every corner and border
contour, and `none` removes it. With Manga and Brush borders it draws the
whole ink contour. Header renders the paint layer that shaped contours need.
Native markup adds the `.panel-shadow` child described in
[tokens](../tokens.md). The default and plain variants have no shadow.

## Sizes

`size="compact"` uses a 44px minimum height, no block padding, and 4px inline padding.
`size="default"` uses 10px padding on all sides and a 60px minimum.
`size="editorial"` uses 20px padding on all sides and an 80px minimum. Omit `size`
to follow `data-header-size="compact|default|editorial"`; without either,
Header uses Default. Size is independent of variant. These are minimums: wrapped
content and larger controls can grow the bar.

Header spacing adapts responsively with semantic spacing tokens;
child Links, IconButtons, and DropdownMenu triggers keep their own sizes.
 When its children wrap, for example tabs on a
second line on a phone, it grows to contain them. A Header with a
[ScopeSwitcher](scope-switcher.md) stays one row: below 700px the compact
scope trigger takes the place of the segments.

## States

| State | Behavior |
| --- | --- |
| default | Brand, primary destinations, and global actions are visible. |
| hover | Child Links and IconButtons own hover feedback. |
| focus | Focus follows document order; each child shows `--color-focus`. |
| active | The current Link is marked; pressed actions keep their component behavior. |
| disabled | Header itself is never disabled. Unavailable children follow their own specs. |
| collapsed | At narrow viewports, preserve the home Link and essential actions; move lower-priority destinations into DropdownMenu. Below 700px a ScopeSwitcher collapses to its own compact trigger, never into the overflow menu. |

## Accessibility

Use `<header>` and a labelled `<nav>` for the destination group. Do not add
`role="banner"` when native `<header>` already provides it. Keep one banner
landmark per page, label multiple navigation landmarks distinctly, and retain
normal Link and IconButton keyboard behavior. Opening DropdownMenu moves focus
according to its own roving-focus behavior; closing returns focus to its
IconButton trigger.

## Terminal

In a terminal, Header is `tui-kiso` `Header`: the app bar, one row, once per
screen. It says which product this is and where the person works. A page
has its own `PageHeader`; `Title` is the title line inside it.

| Part | Terminal form |
| --- | --- |
| Brand | Product and version, bold `primary-foreground` on `primary`. |
| Scope | `.scope("pg-main")`, the project or environment, in `foreground`. |
| Path | `.breadcrumb([...])` or `.title(...)`, drawn as a `Breadcrumb` after a `│` in `subtle-foreground`. |
| Right side | `.right(spans)`: a user or a status, kept at the right edge. |

The rest of the row stays unpainted. When the row runs out of width, the
right side drops first and never cuts the scope, then the path collapses
to `…`. The brand always stays. A screen with a [Sidebar](sidebar.md) can put the
brand at the top of the sidebar instead. Header has no actions: they belong to
`PageHeader`. See
[terminal interfaces](../terminal-interfaces.md).

## When to use

- Persistent product identity, top-level destinations, and global actions.
- Wide layouts where top navigation is clearer than a Sidebar.

## When NOT to use

- For a page title and page-specific actions; use [PageHeader](page-header.md).
- As a Card header or decorative masthead.
- For a long hierarchy; use [Sidebar](sidebar.md) or Breadcrumb.

## Radix/shadcn mapping

No Radix Header primitive. Use native `<header>` + `<nav>`, Kiso Link and
IconButton, and shadcn Dropdown Menu / Radix Dropdown Menu when overflow is
needed. shadcn Navigation Menu is not required for a simple set of Links.

The `plain` variant stays in normal document flow. It does not stick over
scrolling content because its background is transparent. The `floating`
variant keeps the surface fill and adds a shadow, so it can float over
scrolling content.
