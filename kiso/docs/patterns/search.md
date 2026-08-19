# Search

Search-driven interaction for narrowing a visible collection by query. This
pattern composes the [Search](../components/search.md) component into a list or
table toolbar and governs when, how, and where filtering by query happens.

User story #6.

## Purpose

Search lets the person type a query to narrow what they already see — rows in a
[Table / DataTable](../components/table.md), items in a list-detail master, or
entries in a panel. The collection owns the data; Search only supplies the query
string. It is **not** global navigation or command execution — that is the
[command palette](command-palette.md).

**Canonical rule:** A list screen must not reinvent search, filters,
pagination, and empty state. Compose [Search](../components/search.md) — do not
invent a parallel query field per list.

## Component composition

| Region | Compose with | Role |
| --- | --- | --- |
| Query field | [Search](../components/search.md) | Live-filter or submit-filter the collection; scoped to this list |
| Clear control | Search's built-in Clear [IconButton](../components/icon-button.md) | Resets query; keeps focus in the field |
| Pending indicator | [Spinner](../components/spinner.md) inside Search | Results are resolving (server-side or slow index) |
| Result count | polite live region or toolbar text | "12 of 40 replicas" after results settle |
| No matches | [EmptyState](../components/empty-state.md) `no-results` | Replaces the collection body, not a Search error |
| Invalid query | [ValidationMessage](../components/validation-message.md) via [FormField](../components/form-field.md) | Only when the query syntax itself is invalid (regex, etc.) |

Search sits in the list toolbar, beside [filtering](filtering.md) controls and
above [Pagination](../components/pagination.md). It is a sibling of those
controls, not nested inside the table.

## Flow

### Instant (client-side or fast index)

1. Person types into the Search field.
2. Query is debounced (product-defined; short enough to feel live).
3. Collection re-filters. Result count updates in a polite live region.
4. If the query matches nothing, the collection body shows
   [EmptyState](../components/empty-state.md) `no-results` with a
   "Clear search" action.
5. Clearing the query restores the full collection; focus stays in the field.

### Submit (expensive server query)

1. Person types the query. Results do not change yet.
2. Person presses `Enter` or activates a visible "Search" [Button](../components/button.md).
3. The results region enters loading ([Skeleton](../components/skeleton.md)
   rows), and `aria-busy` is set on the region.
4. Results arrive; region swaps to populated or no-matches EmptyState.

Do not mix instant and submit behavior on the same Search field without making
the mode obvious. Pick one per surface and keep it consistent.

## States

| State | Behavior |
| --- | --- |
| idle | Empty query; full collection visible. Field is ready to type. |
| typing (instant) | Debounced; results update without focus leaving the field. |
| resolving | Query submitted; [Spinner](../components/spinner.md) inside Search; region `aria-busy`. Query value stays visible — do not clear it. |
| no matches | Collection body → [EmptyState](../components/empty-state.md) `no-results`. Offer "Clear search". The Search field keeps the query so the person can edit it. |
| error | Results failed to load. Show [Alert](../components/alert.md) (what/why/now) above or in place of the body with a retry [Button](../components/button.md). Do not show an EmptyState for a failure. |
| invalid query | Rare. Only when the query syntax is invalid (e.g. malformed regex). `aria-invalid` + [ValidationMessage](../components/validation-message.md). Zero hits is **not** invalid. |

Loading, empty, and error must never be ambiguous: Skeleton rows ≠ EmptyState
no-results ≠ Alert.

## Layout sketch

```text
┌──────────────────────────────────────────────────────────────────────┐
│ PageHeader: Queries                       [Create query]             │
├──────────────────────────────────────────────────────────────────────┤
│ Toolbar                                                              │
│ [🔍 Search queries..............] [Status▾] [Clear filters]          │
│                                                                      │
│ 12 of 40 queries                                                     │
├──────────────────────────────────────────────────────────────────────┤
│ Table / DataTable                                                    │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Name              Author     Status    Modified                 │  │
│ │ slow-join         ada        warn      2d ago                  │  │
│ │ index-health      sam        ok        5d ago                  │  │
│ │ ...                                                            │  │
│ └────────────────────────────────────────────────────────────────┘  │
│ ← 1 2 3 … →                                                         │
└──────────────────────────────────────────────────────────────────────┘
```

When the query matches nothing:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Toolbar                                                              │
│ [🔍 no matching..............] [Clear filters]                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│             No queries match "no matching"                           │
│             Try a different search or clear filters.                 │
│                              [Clear search]                          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Rules

- Search is scoped to **one collection**. Do not make a single Search field
  filter two independent tables on the same screen; give each its own field.
- Zero hits is an empty state, not a Search error. Never show
  [ValidationMessage](../components/validation-message.md) for "no results".
- Keep the query visible during loading and no-matches. Clearing the query is
  the person's action, not a side effect of a failed fetch.
- `Escape` clears the query if non-empty (pick one behavior per surface and
  keep it consistent). `Escape` does **not** open the
  [command palette](command-palette.md) — that is `⌘K` / `Ctrl+K`.
- After clearing, keep focus in the Search field and refresh results.
- Do not move focus into the table on every keystroke.
- Highlight matched query terms in results by default. Highlighting is
  reinforcement; the filtered set is the real signal. A product may opt out
  only when highlighting is impractical (e.g. server-side search with no
  match offsets) and must document the opt-out. Keep highlighted text readable
  — use `--color-primary` as a background tint, never as text color that
  drops below contrast.
- Search composes with [filtering](filtering.md): the active query and active
  filters narrow the collection together. Clearing Search does not clear
  filters unless the surface defines that as its single clear action.

## Accessibility

- Accessible name always present (`label` / `aria-label` / `aria-labelledby`).
  Placeholder is not the name.
- Use native `type="search"` so platform clear and semantics work.
- Debounced instant search updates results without trapping focus. Use a polite
  status region ("12 of 40 replicas") only when the change would otherwise be
  silent.
- No-matches EmptyState must be announced or discoverable; do not leave the
  region visually and accessibly empty.

## Related patterns

- [Filtering](filtering.md) — structured filters that compose with Search.
- [Sorting](sorting.md) — order of the filtered set.
- [Pagination](pagination.md) — paging the filtered set.
- [Command palette](command-palette.md) — global actions and navigation, not
  list filtering.
