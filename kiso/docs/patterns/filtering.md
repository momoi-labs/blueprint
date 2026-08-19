# Filtering

Structured filter controls that narrow a collection by attribute, not by free
text. This pattern composes [Select](../components/select.md),
[DropdownMenu](../components/dropdown-menu.md), [Popover](../components/popover.md),
[Checkbox](../components/checkbox.md), and [Switch](../components/switch.md) into
a consistent filter bar alongside [Search](search.md).

User story #2.

## Purpose

Filters let the person narrow a collection by known attributes — status,
region, engine version, tagged label — with controls whose options are a closed
or bounded set. They complement [Search](search.md): Search narrows by free
text; filters narrow by discrete facet. A list screen composes both rather than
reinventing either.

**Canonical rule:** A list screen must not reinvent search, filters,
pagination, and empty state. Compose filter controls in the toolbar — do not
invent a per-list filter kit.

## Component composition

| Filter shape | Compose with | Example |
| --- | --- | --- |
| One value from a set | [Select](../components/select.md) | "Status: any / healthy / degraded / down" |
| Toggle a single facet on/off | [Switch](../components/switch.md) or [Checkbox](../components/checkbox.md) | "Show only replicas with lag" |
| Multiple values from a set | [Checkbox](../components/checkbox.md) group inside a [Popover](../components/popover.md) | "Region: ☑ eu ☑ us ☐ ap" |
| Range or complex facet | [Popover](../components/popover.md) with form controls | "Lag: 0–500 ms" |
| Quick toggles (few, stable) | [Button](../components/button.md) `ghost` toggle or [Tabs](../components/tabs.md) | "All / Active / Archived" |
| Active-filter summary | [Badge](../components/badge.md) per active filter or a text line | "Status: degraded ×" |

Filters live in the list toolbar, beside [Search](search.md) and above
[Pagination](../components/pagination.md). They are siblings of the table, not
columns.

## Flow

1. Person opens the list. No filters active; full collection (or default
   filter) is visible.
2. Person activates a filter control (Select, Popover trigger, Switch).
3. The collection re-queries or re-filters. The results region shows
   [Skeleton](../components/skeleton.md) rows for server-side filters; for
   client-side filters the set updates without a loading flash.
4. Active filters are summarized as removable [Badge](../components/badge.md)s
   or a text line in the toolbar.
5. If filters exclude everything, the collection body shows
   [EmptyState](../components/empty-state.md) `no-results` with a
   "Clear filters" action.
6. Clearing a filter (via its Badge × or a "Clear filters" control) restores
   the wider set.

## States

| State | Behavior |
| --- | --- |
| idle | No filters active. Default set visible. |
| applying | Server-side: results region `aria-busy`, Skeleton rows. Client-side: set updates immediately. |
| active | One or more filters active. Summarized as Badges or a text line. |
| no matches | Filters exclude everything → [EmptyState](../components/empty-state.md) `no-results`. Offer "Clear filters". Keep filter controls visible and editable. |
| error | Server query failed → [Alert](../components/alert.md) with retry. Do not show EmptyState for a failure. |

Filter controls themselves follow their component states (Select open/closed,
Switch on/off). The list-level states above describe the collection.

## Layout sketch

```text
┌──────────────────────────────────────────────────────────────────────┐
│ PageHeader: Replicas                       [Add replica]             │
├──────────────────────────────────────────────────────────────────────┤
│ Toolbar                                                              │
│ [🔍 Search replicas...] [Status▾] [Region▾] [Show lag only ◯]       │
│                                                                      │
│ Active: [degraded ×] [eu ×]                    [Clear filters]       │
│ 3 of 18 replicas                                                     │
├──────────────────────────────────────────────────────────────────────┤
│ Table / DataTable                                                    │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Name        Host            Status     Lag      Region          │  │
│ │ replica-01  db.eu.example   degraded   820 ms   eu              │  │
│ │ replica-03  db.eu.backup    degraded   1.2 s    eu              │  │
│ │ replica-07  db.eu.dr        degraded   —        eu              │  │
│ └────────────────────────────────────────────────────────────────┘  │
│ ← 1 (of 1) →                                                         │
└──────────────────────────────────────────────────────────────────────┘
```

When filters exclude everything:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Toolbar                                                              │
│ [🔍 ...] [Status▾] [Region▾] [Show lag only ●]                      │
│ Active: [down ×] [ap ×]                       [Clear filters]       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│        No replicas match these filters                               │
│        No replicas with status "down" in region "ap".                │
│                          [Clear filters]                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Rules

- Filters and [Search](search.md) narrow the collection **together**. The
  active query and active filters form one result set. Document whether
  "Clear search" also clears filters (default: no — they are independent unless
  the surface offers a single "Reset all").
- Active filters must be visible and removable individually. A person should
  not have to open a Popover to discover which filters are active.
- Default filters are allowed when they reflect a sensible default view
  ("Active only"). The active-filter summary must still show the default as
  active so it is not a hidden filter.
- Do not invent a filter UI that competes with [Select](../components/select.md)
  / [Checkbox](../components/checkbox.md) / [Popover](../components/popover.md).
  If the facet is one-of-many, use Select; if many-of-many, use a Checkbox
  group in a Popover.
- Filter state is part of the list's state, not global. Navigating away and
  back may restore it (documented per surface) but filters must not leak into
  unrelated lists.
- A filter that changes the set dramatically (e.g. "Show deleted") should make
  the change obvious — a visible Badge and, if the consequence is surprising, a
  short note.
- Combine filters with [sorting](sorting.md) and [pagination](pagination.md)
  consistently: filter narrows, sort orders, pagination pages.

## Accessibility

- Each filter control has an accessible name ("Status", "Region", "Show only
  replicas with lag"). Placeholder alone is not a name for Select.
- Active-filter Badges that are removable are [IconButton](../components/icon-button.md)s
  or Buttons with `aria-label` like "Remove status filter: degraded".
- When filters change the result set, update a polite live region or the result
  count so screen reader users know the set changed.
- No-matches [EmptyState](../components/empty-state.md) must be reachable and
  announced; keep filter controls in the tab order so the person can adjust.

## Related patterns

- [Search](search.md) — free-text narrowing that composes with filters.
- [Sorting](sorting.md) — ordering the filtered set.
- [Pagination](pagination.md) — paging the filtered set.
- [Large data tables](large-data-tables.md) — tables where filters are
  essential to manage volume.
