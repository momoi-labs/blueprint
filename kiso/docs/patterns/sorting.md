# Sorting

Column sorting with visible indicators and consistent cycle. This pattern
governs how a [Table / DataTable](../components/table.md) orders its rows by a
sortable column, and how that order is communicated.

User story #7.

## Purpose

Sorting lets the person reorder the current result set by a comparable column —
name, lag, modified date, row count. It answers "which of these is most/least
X?" without the person scrolling to compare manually. Sorting orders the set
that [Search](search.md) and [filtering](filtering.md) have already narrowed.

## Component composition

| Region | Compose with | Role |
| --- | --- | --- |
| Sortable header | [Table / DataTable](../components/table.md) ColumnHeaderCell with sort control | Button inside the header that toggles sort |
| Sort indicator | icon in the header (▲ / ▼) | Visual + accessible direction; not color alone |
| Unsortable header | plain `<th>` | No sort control, no `aria-sort` |
| Sort announcement | polite live region | "Sorted by lag, descending" when not obvious from focus |

The sort control is a button (or a nested button) inside the `<th>`. It is not
a separate "Sort" dropdown outside the table.

## Flow

1. Person views the table with its default sort (or unsorted).
2. Person activates a sortable header (click or keyboard `Enter`/`Space` on
   the header button).
3. Sort cycles: unsorted → ascending → descending → unsorted (or
   ascending → descending → ascending if a default sort is required and
   "unsorted" is not meaningful).
4. The rows reorder. If server-side, the region shows
   [Skeleton](../components/skeleton.md) rows during the fetch; if client-side,
   the set reorders immediately.
5. The header's `aria-sort` and visible indicator update.
6. The sort interacts with [pagination](pagination.md): changing sort on a
   paged set resets to page 1 (the person should see the top of the new order).

## States

| State | Header behavior | Tokens |
| --- | --- | --- |
| unsorted | No indicator. `aria-sort="none"`. Sort control still present on sortable headers. | Header default tokens. |
| ascending | ▲ indicator. `aria-sort="ascending"`. | Indicator `--color-foreground` or `--color-primary`. |
| descending | ▼ indicator. `aria-sort="descending"`. | Same as ascending. |
| applying | Server-side: body shows Skeleton rows; `aria-busy` on the region. Header indicator already shows the new direction. | |
| error | Sort query failed → [Alert](../components/alert.md). Do not leave a stale sort indicator with mismatched rows. | |

The sort indicator must be visible without relying on color alone. Use an icon
(▲ / ▼ or an equivalent) plus `aria-sort`.

## Layout sketch

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Toolbar                                                              │
│ [🔍 Search replicas...] [Status▾]                                   │
│ 18 replicas                                                          │
├──────────────────────────────────────────────────────────────────────┤
│ Table / DataTable                                                    │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Name ▲      Host            Status     Lag ▼      Region       │  │
│ │ analytics   db.an.example   ok        1.2 s      ap            │  │
│ │ replica-01  db.eu.example   degraded  820 ms     eu            │  │
│ │ replica-03  db.eu.backup    degraded  410 ms     eu            │  │
│ │ replica-07  db.eu.dr        ok          —        eu            │  │
│ │ ...                                                            │  │
│ └────────────────────────────────────────────────────────────────┘  │
│ ← 1 2 3 … →                                                         │
└──────────────────────────────────────────────────────────────────────┘
```

`Lag ▼` is the active sort (descending): highest lag first. `Name ▲` shows a
previous or secondary direction indicator only if the surface supports
multi-sort; otherwise only one column carries an indicator at a time.

## Rules

- One primary sort column at a time unless the product explicitly supports
  multi-sort. Multi-sort is rare; if supported, document the precedence order
  and show secondary indicators subtly.
- Default sort is allowed and often sensible (e.g. "Modified, descending").
  The default-sorted column shows its indicator on first render.
- The sort cycle is consistent across the product. Pick one —
  unsorted → asc → desc → unsorted, or asc → desc → asc — and keep it.
- Sort changes the **order of the current result set** (client) or the
  **query** (server). Document which on the screen or in its notes.
- Changing sort on a paged set resets to page 1. The person expects to see the
  top of the new order, not page 3 of the old one.
- Do not sort by a column the person cannot see. If a column is hidden by
  responsive collapse ([large-data-tables](large-data-tables.md)), it should
  not be the active sort — or its sort must transfer to a visible column.
- Unsortable columns (e.g. row actions, a Badge-only status that has no natural
  order) have no sort control and no `aria-sort`.
- Sort interacts with [filtering](filtering.md) and [Search](search.md): the
  filtered/searched set is what gets sorted. Sorting does not widen the set.

## Accessibility

- Sortable headers use a button with `aria-sort` on the `<th>`:
  `ascending`, `descending`, or `none`.
- The sort direction is announced when it changes, especially when focus does
  not remain on the header (e.g. server-side sort that swaps rows). Use a
  polite live region: "Sorted by lag, descending."
- The header button has an accessible name that includes the column: "Sort by
  lag". The visible label plus icon is the name; do not rely on the icon alone.
- Keyboard: `Tab` reaches sortable headers; `Enter` / `Space` toggles sort.
  Arrow-key grid navigation, if implemented, follows the
  [Table](../components/table.md) keyboard model.

## Related patterns

- [Search](search.md) — narrows the set before sorting.
- [Filtering](filtering.md) — narrows the set before sorting.
- [Pagination](pagination.md) — pages the sorted set.
- [Large data tables](large-data-tables.md) — tables where sort + scroll is the
  primary navigation.
