# Pagination

Moves through explicit dataset pages.

## Purpose

Pagination exposes position and direct page navigation when page numbers help
the person reason about a dataset. It composes with Table/DataTable; it does
not replace filtering or Search. For progress in a guided flow, use [Steps](steps.md).

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
`--color-focus`, `--spacing-xs` between controls, `--spacing-sm` block and
inline control padding, and the five property-qualified label typography
tokens.

## Variants

No visual variants. Pagination uses the numbered model shown above; optional
ellipsis and result summary are composition choices, not variants.

## Sizes

One size. Page controls keep one consistent target and label treatment; use
semantic spacing rather than introducing `sm` or `lg` pagination.

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

## Step indicator variant

The step indicator specification now lives in [Steps](steps.md). Steps keeps
explicit completion, native navigation and current-step semantics, and adds
vertical and compact layouts. Pagination's page API is unchanged.

## Terminal

In a terminal, Pagination is `tui-kiso` `Pagination`: one row,
`‹ 1 2 3 4 … 9 ›`, with the current page on a `primary` fill.

| State | Terminal form |
| --- | --- |
| default | Page numbers two cells apart. With more than 7 pages, the first, the last and the pages around the current one show, with `…` for the rest. |
| current | Bold `primary-foreground` on `primary`, with round ends when the look has them. |
| first, last | The arrow that cannot move takes `disabled`. |
| narrow | When the numbers do not fit, about 24 cells, the row becomes `‹ 3 of 9 ›`. |
| summary | `.summary(first, last, total)` adds "41 to 60 of 173" in `muted-foreground` at the left, and the pages move to the right. |

`←` `→` and `h` `l` move the page through `key`, which says when the page
changed. The product loads the rows. Put it under a [Table](table.md) with
`Table::pagination`.

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
