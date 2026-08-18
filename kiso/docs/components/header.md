# Header

Application-level chrome that keeps primary navigation and global actions in a
predictable place. Header is a layout container, not a primitive.

## Purpose

Header orients the person and exposes a small set of destinations and actions
that remain useful across routes. It composes [Link](link.md) for navigation,
[IconButton](icon-button.md) for icon-only actions, and optionally
DropdownMenu for overflow. Do not replace those controls with clickable
containers.

## Anatomy

```
Header
├── brand/home Link
├── primary Navigation
│   └── Link(s)
└── actions
    ├── IconButton(s)
    └── DropdownMenu (optional, triggered by IconButton)
```

Use `--color-surface`, `--color-foreground`, and `--color-border`; spacing,
type, radius, and motion use their semantic token families. The current Link
uses `aria-current="page"` and `--color-primary`.

## States

| State | Behavior |
| --- | --- |
| default | Brand, primary destinations, and global actions are visible. |
| hover | Child Links and IconButtons own hover feedback. |
| focus | Focus follows document order; each child shows `--color-focus`. |
| active | The current Link is marked; pressed actions keep their component behavior. |
| disabled | Header itself is never disabled. Unavailable children follow their own specs. |
| collapsed | At narrow viewports, preserve the home Link and essential actions; move lower-priority destinations into DropdownMenu. |

## Accessibility

Use `<header>` and a labelled `<nav>` for the destination group. Do not add
`role="banner"` when native `<header>` already provides it. Keep one banner
landmark per page, label multiple navigation landmarks distinctly, and retain
normal Link and IconButton keyboard behavior. Opening DropdownMenu moves focus
according to its own roving-focus behavior; closing returns focus to its
IconButton trigger.

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
