# Breadcrumb

Shows the current page's position in a hierarchy and links to its ancestors.

## Purpose

Breadcrumb answers “where am I?” across nested routes. Unlike [Tabs](tabs.md),
it does not switch peer content within the current page.

## Anatomy

```
Breadcrumb navigation
└── ordered list
    ├── ancestor Link
    ├── separator (decorative)
    └── current page (text)
```

Use `--color-muted-foreground` for ancestors, `--color-foreground` for the
current page, `--color-primary` for Link interaction, and `--color-focus` for
focus. Separators use the muted role and are hidden from assistive technology.

## States

| State | Behavior |
| --- | --- |
| default | Ancestors are Links; the current page is plain text. |
| hover | Ancestor Link shows its Link hover treatment. |
| focus | Focused ancestor shows `--color-focus`. |
| active | Pressing an ancestor follows its URL. Current page carries `aria-current="page"`. |
| disabled | N/A. Do not render a disabled breadcrumb Link. |
| overflow | Collapse middle ancestors into an accessible menu; keep the root and current page visible. |

## Accessibility

Use `<nav aria-label="Breadcrumb">` with an `<ol>`. Separators are CSS or
`aria-hidden="true"`. Do not make the current page a self-link. Keyboard
behavior is native Link/menu behavior; `Tab` visits Links, not separators.

## When to use

- Routes at least two meaningful levels deep.
- Technical products where parent context is useful for returning upward.

## When NOT to use

- Switching panels on one page; use Tabs.
- A flat product with no hierarchy.
- As a substitute for the page title or browser history.

## Radix/shadcn mapping

Radix has no Breadcrumb primitive. Map structure to shadcn Breadcrumb while
preserving native `<nav>`, ordered-list, and Link semantics. Use DropdownMenu
for collapsed middle items.
