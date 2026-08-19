# Pagination

Explicit page navigation for known or meaningfully bounded datasets. This
pattern composes the [Pagination](../components/pagination.md) component below a
[Table / DataTable](../components/table.md) and governs when paging is the right
model versus [large-data-tables](large-data-tables.md) virtualization or
incremental loading.

User stories #3, #11.

## Purpose

Pagination exposes position and direct page navigation when page numbers help
the person reason about a dataset: "page 7 of 40", "show me the next 20
replicas". It composes with [Search](search.md), [filtering](filtering.md), and
[sorting](sorting.md) — those narrow and order the set; Pagination pages it.

**Canonical rule:** A list screen must not reinvent search, filters,
pagination, and empty state. Compose [Pagination](../components/pagination.md)
— do not invent a per-list pager.

## Component composition

| Region | Compose with | Role |
| --- | --- | --- |
| Page navigation | [Pagination](../components/pagination.md) | Previous / page numbers / Next below the table |
| Position summary | text line or Pagination result summary | "Page 3 of 12 · 41–60 of 230 replicas" |
| Page size control | [Select](../components/select.md) (optional) | "20 / 50 / 100 per page" |
| Loading state | [Skeleton](../components/skeleton.md) rows in the body | While a page fetch runs |

Pagination is a sibling below the table, not a table row. It is a navigation
region: `<nav aria-label="Pagination">`.

## Flow

1. Person views page 1 of the result set (already narrowed by Search/filters
   and ordered by sort).
2. Person activates a page number, Previous, or Next.
3. The results region enters loading: [Skeleton](../components/skeleton.md)
   rows replace the body, `aria-busy` on the region. Pagination controls stay
   visible and the current page is still indicated.
4. The new page arrives; body swaps to populated rows.
5. If the page is empty (e.g. filters changed and the set shrank), show
   [EmptyState](../components/empty-state.md) `no-results` and reset to page 1.

Changing [Search](search.md) query, [filters](filtering.md), or
[sort](sorting.md) resets to page 1 — the person expects the top of the new
result set.

## States

| State | Behavior |
| --- | --- |
| idle | Page loaded; Pagination shows current position. |
| loading | Body shows Skeleton rows; `aria-busy` on the region. Controls remain; duplicate page requests are prevented. Previous/Next at a boundary are disabled with `--color-disabled`. |
| boundary | Previous disabled on page 1; Next disabled on last page. Page Links are never disabled — they are omitted or replaced by ellipsis. |
| empty | Set shrank to zero → [EmptyState](../components/empty-state.md) `no-results`; reset to page 1. |
| error | Page fetch failed → [Alert](../components/alert.md) with retry. Do not leave Skeleton rows up after failure. |

## Layout sketch

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Toolbar                                                              │
│ [🔍 Search replicas...] [Status▾]                                   │
│ 230 replicas · Page 3 of 12                                          │
├──────────────────────────────────────────────────────────────────────┤
│ Table / DataTable                                                    │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Name ▲      Host            Status     Lag ▼      Region       │  │
│ │ replica-41  db.eu.example   ok          12 ms     eu            │  │
│ │ replica-42  db.eu.backup    ok           8 ms     eu            │  │
│ │ ...                                                            │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ Page 3 of 12 · 41–60 of 230        [20 / page ▾]                    │
│ ←  1  2  [3]  4  5  …  12  →                                       │
└──────────────────────────────────────────────────────────────────────┘
```

## Rules

- Use Pagination when the dataset size is **known or meaningfully bounded** and
  page position helps the person. For unbounded activity streams, use
  incremental loading instead.
- Do not use Pagination to hide a missing [Search](search.md) or
  [filtering](filtering.md) capability. If the person must page through 200
  pages to find one row, the list is missing Search.
- Changing Search, filters, or sort resets to page 1.
- Selection policy across pages must be explicit: either clear selection on
  page change, or keep a cross-page selection model with a visible count
  ("3 selected across pages"). Pick one per surface and document it.
- Page size, if configurable, is a [Select](../components/select.md) with a
  small set of sensible options. Changing page size resets to page 1.
- For very large client-side sets (thousands of rows) where paging is not the
  task, prefer virtualization — see [large-data-tables](large-data-tables.md).
  Pagination is for known, page-shaped sets; virtualization is for scrolling
  one large loaded set.
- Do not combine Pagination and infinite scroll on the same table. Pick one
  model per surface.

## Accessibility

- Use `<nav aria-label="Pagination">`. Give controls names such as "Go to
  page 4", "Previous page", "Next page"; the visible numeral alone is not
  enough.
- Current page has `aria-current="page"`. Ellipses are not focusable.
- After a page change, move focus to the results heading or announce the
  updated range in a polite live region ("Showing 41 to 60 of 230 replicas").
- Previous/Next at a boundary use `--color-disabled` and `aria-disabled`;
  page Links are never disabled.
- Native Link or Button keyboard behavior applies; `Tab` moves through
  controls.

## Related patterns

- [Search](search.md) — narrows the set before paging.
- [Filtering](filtering.md) — narrows the set before paging.
- [Sorting](sorting.md) — orders the set before paging.
- [Large data tables](large-data-tables.md) — when virtualization is the
  better model than paging.
