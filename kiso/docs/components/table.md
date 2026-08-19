# Table / DataTable

A dense, scannable grid of records. Rows are entities; columns are
comparable fields. DataTable is the same component with sorting, filtering
composition, pagination, and row selection switched on.

## Purpose

Table is the primary surface for Momoi's data-heavy products: replicas,
queries, metrics series, config keys, log lines. The person scans, compares,
sorts, selects, and acts on many similar items.

User stories #3 and #21.

**Table** is the structural grid (header, body, optional footer).
**DataTable** is Table plus the interactive behaviors listed below. Prefer the
name DataTable in product UI copy when those behaviors are present; the
spec is one component.

### Composition

| Concern | Compose with | Notes |
| --- | --- | --- |
| Loading rows | [Skeleton](skeleton.md) | Skeleton *text* cells inside rows; keep chrome. |
| Empty dataset | [EmptyState](empty-state.md) | Replaces the body; keep column headers when helpful. |
| Error loading | [Alert](alert.md) | Above or in place of the body; retry via Button. |
| Filter visible rows | [Search](search.md) | Standalone; not built into Table. User story #9. |
| Page through known sets | [Pagination](pagination.md) | Known total / page size. User story #11. |
| Row actions | [DropdownMenu](dropdown-menu.md) or [IconButton](icon-button.md) | Per-row contextual actions. |
| Bulk actions | [Button](button.md) in a selection toolbar | Appear when one or more rows are selected. |

Do not invent a second "table kit". Loading, empty, and error are *states of
this component*, expressed by composing the pieces above.

## Anatomy

```
DataTable
├── Toolbar (optional)
│   ├── Search (filter; optional)
│   ├── Filters / view controls (optional)
│   └── Bulk action Buttons (when rows selected)
├── Table
│   ├── Caption (optional; accessible name for the table)
│   ├── Header (thead)
│   │   └── HeaderRow
│   │       ├── SelectionHeaderCell (optional checkbox)
│   │       └── ColumnHeaderCell × N
│   │           ├── Sort control (optional)
│   │           └── Resize handle (optional)
│   ├── Body (tbody)
│   │   ├── DataRow × N
│   │   │   ├── SelectionCell (optional checkbox)
│   │   │   ├── DataCell × N
│   │   │   └── RowActionsCell (optional)
│   │   ├── SkeletonRow × N (loading only)
│   │   └── Empty / Error region (replaces DataRows)
│   └── Footer (tfoot; optional totals / summary)
└── Pagination (optional; below the table)
```

- **Caption.** Visible or visually hidden. Required accessible name for the
  table (`<caption>` or `aria-labelledby`).
- **ColumnHeaderCell.** Column title. Sortable headers are buttons (or have a
  nested button), not plain text.
- **DataCell.** One value. Prefer plain text; [Badge](badge.md) for status;
  [Link](link.md) only when the cell navigates.
- **SelectionCell.** [Checkbox](checkbox.md) for multi-select membership.
- **RowActionsCell.** Usually a DropdownMenu trigger (kebab / more), not a
  pile of Buttons.
- **Toolbar.** Outside the `<table>`. Owns Search, filters, and bulk actions.
- **Pagination.** Sibling below the table, not a table row (navigation slice).

## Variants

| Variant | Behavior |
| --- | --- |
| `plain` | Structural table only: no sort, selection, or pagination. Rare; prefer DataTable. |
| `data` (default) | Sort, optional row selection, Search composition, Pagination when the set is paged. |

Density is a presentation choice, not a named color variant:

| Density | Use | Tokens |
| --- | --- | --- |
| `comfortable` | Default for most product tables. | Cell padding `--spacing-sm` block, `--spacing-md` inline. All five body typography properties. |
| `compact` | Ops dashboards, wide schemas, log-like grids. | Cell padding `--spacing-xs` block, `--spacing-sm` inline. Same five body typography properties (do not shrink below readable). |

Header background `--color-surface`. Body rows `--color-surface` on
`--color-background` page canvas, or zebra with alternating
`--color-elevated-surface` / `--color-surface` when it aids scanning — never
raw stripes. Borders `--color-border`. Text `--color-foreground`; secondary
cell metadata `--color-muted-foreground`.

### Column behaviors

| Behavior | Spec |
| --- | --- |
| **Sortable** | Header exposes sort control. One primary sort column at a time unless the product explicitly supports multi-sort (rare; document in the screen). Cycle: unsorted → ascending → descending → unsorted (or omit unsorted if a default sort is required). |
| **Sticky header** | Header stays visible while the body scrolls inside a scrollport. Use when the table is taller than the viewport. Sticky uses the same `--color-surface` as the header so rows do not show through. |
| **Column resize** | Optional. Drag handle on the header edge. Persist width in product state when useful. Minimum width must keep the header label readable; do not specify px — use ch, the label typography properties, and `--spacing-sm`. |
| **Virtualization** | Guidance, not a separate variant. For large client-side sets (thousands of rows), virtualize the body so only visible rows mount. Keep header, selection model, and keyboard navigation correct. Prefer server-side Pagination when the dataset is known and paged; virtualize when scrolling one large loaded set. |

Filtering is **not** a Table variant. [Search](search.md) (and optional
filter chips) live in the Toolbar and feed the data query or client filter.

## Sizes

Table has no `sm` / `md` / `lg` control scale like Button. Size comes from:

| Axis | Token / rule |
| --- | --- |
| Type | All five property-qualified body typography tokens for cells; all five property-qualified label typography tokens for headers. |
| Cell padding | Density table above (`--spacing-xs`, `--spacing-sm`, and `--spacing-md`). |
| Radius | Outer wrapper `--radius-md` when the table sits in a framed panel; internal cells are square. |
| Checkbox / IconButton in cells | `sm` controls so row height stays dense. |

Do not invent a fourth density. Do not set row height in raw pixels.

## States

The table as a whole has mutually exclusive *data* states. Interactive
chrome (headers, checkboxes, row actions) still has control states.

### Data states (user story #3)

| State | Presentation | Behavior |
| --- | --- | --- |
| **Loading** | Keep header (and toolbar if already meaningful). Body shows Skeleton rows matching column count and approximate page size. Region `aria-busy="true"` with a polite status ("Loading replicas"). | Do not show EmptyState or stale rows next to Skeletons. Do not disable the whole page. |
| **Empty** | Body replaced by [EmptyState](empty-state.md). Headers may remain so column meaning is clear. | Empty means *zero matching records*, not "still loading". If Search/filters are active, EmptyState copy should say no matches and offer clear-filters when applicable. |
| **Error** | Remove Skeletons. Show [Alert](alert.md) `error` with retry. Optionally keep headers. | Do not leave an empty table that looks like success. After retry, return to loading then populated/empty. |
| **Populated** | DataRows + optional Pagination. | Default happy path. |

Loading vs empty vs error must never be ambiguous: Skeleton ≠ EmptyState ≠
Alert.

### Interaction states

| State | Where | Behavior |
| --- | --- | --- |
| default | Rows, headers, cells | Interactive affordances at rest. |
| hover | DataRow, sortable header, resize handle | Quiet emphasis (`--color-elevated-surface` or border). Cursor indicates affordance. Transition `--motion-duration-fast` / `--motion-easing-standard`. |
| focus | Sort button, Checkbox, row action, Pagination | Visible `--color-focus` ring. Row focus for roving tabindex patterns follows the keyboard model below. |
| active | Sort control, Checkbox, menu trigger | Pressed / open as for those controls. |
| disabled | Individual Checkbox, sort, or action | Native/disabled semantics with `--color-disabled`. Prefer hiding irrelevant actions over a sea of disabled controls. |
| loading | Whole table data state, or a single row action | Table-level: Skeleton rows. Row action: Button/IconButton loading ([Spinner](spinner.md)). |
| selected | DataRow | One or more rows selected. Background `--color-elevated-surface` or a left accent border using `--color-primary` (not a filled primary row — primary is a text/action role). Selection Header Checkbox reflects none / some / all. |
| sorted | ColumnHeaderCell | `aria-sort="ascending"` \| `"descending"` \| `"none"`. Visible sort indicator (icon); do not rely on color alone. |

### Sorting

- Sort changes the **order of the current result set** (client) or the
  **query** (server). Document which on the screen.
- Announce sort changes politely when they are not obvious from focus
  ("Sorted by name, ascending").
- Unsortable columns have no sort control and no `aria-sort`.

### Pagination

- Use Pagination when the dataset size is known or page-shaped (user story
  #11). Infinite scroll is a pattern (Epic #4), not a Table state — and is
  usually wrong for ops tables where "page 7 of 40" matters.
- Changing page keeps selection policy explicit: either clear selection or
  keep a cross-page selection model — pick one per product surface and say so.
- While a page fetch runs, prefer Skeleton rows inside the body over blanking
  the chrome.

### Row selection

- Multi-select via Checkbox in the leading column. Header Checkbox toggles
  all rows **on the current page** (or all loaded rows if virtualized without
  pages) unless the product defines "select all matching query" — that needs
  explicit copy and a confirmation.
- Selected count appears in the Toolbar ("3 selected") with bulk actions.
- Single-select (radio-like) is rare; if needed, one selected row at a time
  and no Header Checkbox.
- Do not use row click alone for selection when the row also navigates; keep
  Checkbox as the selection affordance and Link/Button for navigation/actions.

## Accessibility

- Use a real `<table>` with `<thead>`, `<tbody>`, and `<th scope="col">`
  (and `scope="row"` when row headers exist). Do not fake a table with CSS
  grids for tabular data.
- Accessible name via `<caption>` or `aria-labelledby`.
- Sortable headers: the sort control is a button; set `aria-sort` on the
  `<th>`.
- Selection Checkboxes: each has an accessible name ("Select row {name}" /
  "Select all rows on this page"). Indeterminate Header Checkbox uses the
  Checkbox indeterminate state.
- Loading: `aria-busy="true"` on the table region; Skeletons `aria-hidden`.
  See [Skeleton](skeleton.md).
- Empty: EmptyState is the content; do not leave an empty `<tbody>` with no
  explanation.
- Error Alert: follow [Alert](alert.md) focus guidance on failure after a
  user-initiated refresh.
- Do not put essential meaning in zebra color alone.
- Sticky header: ensure focus order still follows visual order; do not trap
  focus under a sticky layer.

### Keyboard

| Key | Action |
| --- | --- |
| `Tab` / `Shift+Tab` | Move through interactive controls: toolbar, sort buttons, Checkboxes, row actions, Pagination. |
| `Enter` / `Space` | Activate the focused control (sort, Checkbox, menu trigger, Button). |
| Arrow keys | Within DropdownMenu / composite widgets per those specs. Optional grid navigation inside the table body is allowed when implemented as a composite; if so, document `aria-activedescendant` or roving tabindex and keep one tab stop into the grid. |
| `Escape` | Closes an open row DropdownMenu; does not clear selection unless the product defines that. |

## When to use

- Many similar records with comparable fields (user story #21).
- The person needs to sort, page, select, or scan columns.
- Ops and data tools: databases, jobs, configs, metrics inventories.

## When NOT to use

- **One or two fields about a single entity.** Use a definition list, Card,
  or PageHeader — not a one-row table.
- **Hierarchical location.** Breadcrumb (navigation slice).
- **Free-form layout.** Cards or a custom panel; tables imply comparison.
- **Charts.** Deferred to v2; do not stretch Table into a graph.
- **Global actions / jump-to.** [CommandPalette](command-palette.md), not a
  table of commands.
- **Filtering UI embedded as magic columns.** Use Search + filters in the
  Toolbar.

## Tokens

Consume only semantic roles: `--color-background`, `--color-surface`,
`--color-elevated-surface`, `--color-foreground`, `--color-muted-foreground`,
`--color-border`, `--color-primary`, `--color-focus`, `--color-disabled`,
`--color-danger` (via Alert on error); the five property-qualified body and
label typography tokens; `--spacing-xs`, `--spacing-sm`, `--spacing-md`;
`--radius-md`; `--motion-duration-fast`; and `--motion-easing-standard`. No
palette primitives, no raw hex/px.

## Radix/shadcn mapping

There is no Radix Table primitive for the grid itself. Behavior for menus and
checkboxes comes from those primitives; the table is semantic HTML.

| Kiso | Reference |
| --- | --- |
| Markup and structure | shadcn [Table](https://ui.shadcn.com/docs/components/table) (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`, `TableFooter`) |
| DataTable patterns (sort, selection, toolbar) | shadcn [Data Table](https://ui.shadcn.com/docs/components/data-table) (TanStack Table examples) — adopt interaction patterns; restyle with Kiso tokens |
| Row / header Checkbox | Radix / shadcn Checkbox → Kiso [Checkbox](checkbox.md) |
| Row actions menu | Radix / shadcn Dropdown Menu → Kiso [DropdownMenu](dropdown-menu.md) |
| Loading rows | shadcn Skeleton "Table" example → Kiso [Skeleton](skeleton.md) |
| Empty | Compose [EmptyState](empty-state.md); do not use a blank shadcn row |
| Pagination | Kiso [Pagination](pagination.md), using shadcn Pagination as its structural reference |

Map shadcn Data Table examples by *intent*: sorting state, row selection,
toolbar bulk actions. Replace every utility color and pixel size with Kiso
semantic tokens. Do not copy example row heights or `h-10` / `w-[100px]`
literals.
