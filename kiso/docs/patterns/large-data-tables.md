# Large data tables

Tables with many rows — virtualization, sticky headers, column resize, and
responsive collapse. This pattern composes [Table / DataTable](../components/table.md)
for datasets that exceed a comfortable page or viewport, and references
[data-interfaces.md](../data-interfaces.md) for the data-rendering rules
(alignment, null/unknown, truncation, dangerous values) that every cell still
follows.

User story #3.

## Purpose

When a table holds hundreds or thousands of rows — replicas, query history,
metrics series, log lines — the interaction model shifts. The person scrolls
through a large loaded set, compares columns across a wide schema, and relies
on [Search](search.md) + [filtering](filtering.md) to narrow it. This pattern
governs the table behaviors that make that volume usable: virtualization,
sticky headers, column resize, and responsive column collapse.

It does **not** redefine how cells render. Numeric alignment, null ≠ 0 ≠
unknown, truncation with full-value access, and dangerous-value marking are
defined in [data-interfaces.md](../data-interfaces.md) and apply unchanged
here. This pattern composes those rules; it does not redefine or override them.

## Component composition

| Concern | Compose with | Role |
| --- | --- | --- |
| Grid | [Table / DataTable](../components/table.md) | Structural table with sort, selection, toolbar |
| Volume | virtualized body (guidance, not a separate component) | Only visible rows mount; header, selection, keyboard stay correct |
| Sticky header | DataTable `sticky` header behavior | Header stays visible while the body scrolls |
| Column width | DataTable column resize handle | Person drags to resize; width persisted in product state |
| Narrowing | [Search](search.md) + [filtering](filtering.md) | Reduce the set the person scrolls through |
| Paging | [Pagination](pagination.md) or virtualization | Pick one model per surface (see Rules) |
| Cell rendering | [data-interfaces.md](../data-interfaces.md) rules | Alignment, null/unknown, truncation, dangerous values |
| Row actions | [DropdownMenu](../components/dropdown-menu.md) | Per-row actions; does not break virtualization |
| Empty / error | [EmptyState](../components/empty-state.md) / [Alert](../components/alert.md) | Standard states, not special large-table variants |

## Flow

1. Person opens a large table (e.g. 4,000 replicas). The first viewport of rows
   loads and renders; the rest are virtualized.
2. The header is sticky: as the person scrolls, column titles remain visible.
3. The person uses [Search](search.md) and [filtering](filtering.md) to narrow
   the set. The virtualized body re-renders only visible rows of the filtered
   set.
4. The person sorts a column ([sorting](sorting.md)); the virtualized body
   reorders.
5. For wide schemas, the person resizes columns or the table collapses
   secondary columns responsively (see below).
6. Row actions, selection, and keyboard navigation remain correct throughout
   scroll, sort, and filter changes.

## States

| State | Behavior |
| --- | --- |
| loading | [Skeleton](../components/skeleton.md) rows matching column count and approximate viewport size. `aria-busy` on the region. Keep header and toolbar chrome. |
| populated | Virtualized rows render; only visible rows (plus a small overscan buffer) are mounted. |
| empty | [EmptyState](../components/empty-state.md) `no-results` or `first-run` in the body. Keep headers. |
| error | [Alert](../components/alert.md) with retry; remove Skeletons. |
| scrolling | Sticky header stays aligned with the body. Roving tabindex / `aria-activedescendant` keeps one focused row as the person scrolls. |
| resizing | Column resize handle drags; minimum width keeps the header label readable. Other columns adjust or scroll. |

## Layout sketch

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Toolbar                                                              │
│ [🔍 Search 4,000 replicas...] [Status▾] [Region▾] [Lag range▾]      │
│ 247 replicas match · sorted by Lag ▼                                 │
├──────────────────────────────────────────────────────────────────────┤
│ ↓ sticky header                                                      │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Name      Host            Status   Lag ▼   Conn   Region  Ver  │  │
│ │ replica-1 db.eu.example   ok       12 ms   42     eu      16   │  │
│ │ replica-2 db.eu.backup    degraded 820 ms  18     eu      16   │  │
│ │ replica-3 db.eu.dr        ok          —    9      eu      16   │  │
│ │ replica-4 db.ap.example   ok        4 ms   31     ap      15   │  │
│ │ ...virtualized...                                              │  │
│ │ replica-N db.us.example   warn     2.1 s   7      us      14   │  │
│ └────────────────────────────────────────────────────────────────┘  │
│ ↑ body scrolls independently; header stays                          │
└──────────────────────────────────────────────────────────────────────┘
```

### Responsive collapse

On narrow viewports, collapse columns in a documented priority order — do not
turn rows into cards. This follows the
[responsive tables](../data-interfaces.md) rules in data-interfaces.md:

```text
Wide:    Name | Host | Status | Lag | Conn | Region | Ver
Narrow:  Name | Status | Lag | [Show details ▾]
```

`Name` (key identifier), `Status` (includes danger markers), `Lag` (comparison),
and the primary action stay visible. `Host`, `Conn`, `Region`, and `Ver` move
into row detail under "Show details for {replica}". A danger or warning marker
**never** moves out of the summary row.

## Rules

### Virtualization vs pagination

- **Virtualize** when the person scrolls one large loaded set (thousands of
  client-side rows, or a server cursor that fetches as the person scrolls).
  Keep header, selection model, and keyboard navigation correct.
- **Paginate** ([pagination](pagination.md)) when the dataset is known and
  page-shaped and the person benefits from "page 7 of 40" position.
- Do **not** combine Pagination and infinite scroll / virtualized scroll on the
  same table. Pick one model per surface and document it.

### Sticky header

- Use a sticky header when the table is taller than the viewport. The header
  uses the same `--color-surface` as the header so rows do not show through.
- Ensure focus order still follows visual order; do not trap focus under the
  sticky layer.

### Column resize

- Optional. Drag handle on the header edge. Persist width in product state
  when useful.
- Minimum width must keep the header label readable. Use `ch` / type-role and
  `--spacing-*`, not raw pixels.
- Resizing must not break virtualization, selection, or keyboard order.

### Cell rendering (references data-interfaces.md)

- Numeric columns are right-aligned with `--type-role-numeric` and
  `--font-variant-numeric`; headers align to the same edge. See
  [data-interfaces.md](../data-interfaces.md) → Numeric values.
- `NULL`, `0`, and unknown `—` are three distinct states. See
  [data-interfaces.md](../data-interfaces.md) → Missing and indeterminate
  values.
- Truncate only when a known width is necessary; keep the full value in the DOM
  for copy, search, and accessibility. A truncated value needs visible ellipsis,
  full value in [Tooltip](../components/tooltip.md), and a touch-safe full-value
  path. See [data-interfaces.md](../data-interfaces.md) → Truncation.
- Dangerous values keep the raw value visible with a `Danger` marker; never
  replace `fsync = off` with only "Dangerous". See
  [data-interfaces.md](../data-interfaces.md) → Warnings and dangerous values.

### Selection and keyboard

- Multi-select via [Checkbox](../components/checkbox.md) in the leading column.
  Header Checkbox toggles all rows **on the current page** (paged) or **all
  loaded rows** (virtualized) unless the product defines "select all matching
  query" with explicit copy and confirmation.
- Keyboard: `Tab` reaches interactive controls (toolbar, sort headers,
  checkboxes, row actions). Optional grid navigation inside the body uses
  `aria-activedescendant` or roving tabindex with one tab stop into the grid —
  document it on the screen.
- Do not break keyboard order when virtualizing: the focused row must remain
  in view, and scrolling must not strand focus on a row that unmounts.

## Accessibility

- Use a real `<table>` with `<thead>`, `<tbody>`, `<th scope="col">`.
  Virtualization must not replace the table with non-semantic divs for
  tabular data.
- Accessible name via `<caption>` or `aria-labelledby`.
- `aria-busy` on the region during load; Skeletons `aria-hidden`.
- Sticky header: focus order follows visual order; no focus trap under the
  sticky layer.
- Responsive collapse: hidden fields are reachable through row expansion /
  detail with a named control ("Show details for replica-01"). Tooltip is
  never the only path to a hidden value.

## Related patterns

- [Search](search.md) — narrow the large set by query.
- [Filtering](filtering.md) — narrow the large set by facet.
- [Sorting](sorting.md) — order the large set.
- [Pagination](pagination.md) — the alternative model for known, page-shaped
  sets.
- [data-interfaces.md](../data-interfaces.md) — prescriptive cell-rendering
  rules (alignment, null/unknown, truncation, dangerous values) that this
  pattern composes.
