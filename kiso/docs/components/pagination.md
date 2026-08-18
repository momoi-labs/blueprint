# Pagination

Moves through explicit pages of a known or meaningfully bounded dataset.

## Purpose

Pagination exposes position and direct page navigation when page numbers help
the person reason about a dataset. It composes with Table/DataTable; it does
not replace filtering or Search.

## Anatomy

```
Pagination navigation
├── Previous control
├── page Link(s)
├── ellipsis (optional, non-interactive)
├── Next control
└── result summary (optional)
```

Use Link for URL-addressable pages and Button only for a client-side dataset
whose URL intentionally does not change. Apply `--color-primary`,
`--color-foreground`, `--color-border`, `--color-disabled`, and
`--color-focus`, plus semantic spacing and type tokens.

## States

| State | Behavior |
| --- | --- |
| default | Page destinations and previous/next are available. |
| hover | Interactive page control owns hover feedback. |
| focus | Focused control shows `--color-focus`. |
| active | Current page has `aria-current="page"`; activation loads the target page. |
| disabled | Previous/next at a boundary is unavailable and uses `--color-disabled`; page Links are never disabled. |
| loading | Keep position visible, mark the results region `aria-busy="true"`, and prevent duplicate requests without erasing controls. |

## Accessibility

Use `<nav aria-label="Pagination">`. Give controls names such as “Go to page
4”, “Previous page”, and “Next page”; the visible numeral alone is not enough.
Ellipses are not focusable. After a page change, move focus to the results
heading or announce the updated range in a polite live region. Native Link or
Button keyboard behavior applies.

## When to use

- A known dataset where people benefit from page position or direct jumps.
- Table/DataTable results that are expensive or impractical to load at once.

## When NOT to use

- An unbounded activity stream; use incremental loading.
- A small dataset that fits comfortably on one page.
- To hide missing Search or filtering.

## Radix/shadcn mapping

No Radix Pagination primitive. Use shadcn Pagination as a structural reference
with native Links and Kiso tokens; do not copy utility colors or raw sizes.
