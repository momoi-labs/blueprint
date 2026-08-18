# Dashboard

A scan-first overview of several related metrics or summaries on one page.
Widgets share density and hierarchy rules; the page is not a junk drawer of
unrelated Cards.

User story #30.

## Purpose

Orient the person quickly: what needs attention, what is healthy, and where to
go next. Dashboards summarize; deep investigation happens in list-detail,
tables, or dedicated tool routes.

## Component composition

| Region | Compose with | Role |
| --- | --- | --- |
| Page framing | [PageHeader](../components/page-header.md) | Dashboard title; optional time-range or environment [Select](../components/select.md); optional refresh [IconButton](../components/icon-button.md) / [Button](../components/button.md) |
| Widget unit | [Card](../components/card.md) | One concern per Card (metric cluster, short table, status list) |
| Status | [Badge](../components/badge.md) | Compact health/severity labels inside Cards |
| Dense lists | [Table / DataTable](../components/table.md) | Short "needs attention" tables — still compose Search/EmptyState/Pagination only when those behaviors are truly present |
| Alerts | [Alert](../components/alert.md) | Page-level degraded conditions that outrank widgets |
| Navigation out | [Link](../components/link.md) | "View all" from a widget into list-detail or a tool |
| Shell | [Application shell](application-shell.md) | Header + Sidebar + main |

**Canonical rule (when a widget is a list):** A list screen must not reinvent
search, filters, pagination, and empty state. A dashboard widget that embeds a
mini-list still uses EmptyState and Table composition — it does not invent a
third list pattern.

Tokens: page canvas `--color-background`, widgets `--color-surface` with
`--color-border`, titles `--color-foreground`, supporting
`--color-muted-foreground`, emphasis `--color-primary`, status via Badge
semantic colors, focus `--color-focus`. Prefer quiet surfaces and strong
hierarchy ([principles](../principles.md)).

Charts are out of scope for this epic; when charts exist later, they sit inside
Card like any other widget payload.

## Flow

1. Person opens Overview / Dashboard from Sidebar.
2. PageHeader establishes scope (product area, optional range/environment).
3. Widgets load independently when possible so one slow tile does not block the
   whole page.
4. Person scans Badges and summary numbers, then follows a Link into a deeper
   list-detail or tool view.
5. Refresh updates widget data without remounting the application shell.

Keep widget count deliberate. If a Card has no job beyond decoration, remove
it.

## States

| State | Behavior |
| --- | --- |
| loading | Per-widget Skeleton that preserves Card size; PageHeader stays. Avoid a single full-page Spinner unless the dashboard has no known layout yet. |
| empty (no data in a widget) | EmptyState inside that Card only ("No failing checks") with optional Link; other widgets remain. |
| empty (product not configured) | One page-level [EmptyState](../components/empty-state.md) with a clear next action instead of a grid of hollow Cards. |
| error (one widget) | Alert or error content inside that Card with retry; siblings keep working. |
| error (page) | Alert under PageHeader (what / why / now); widgets may still show last-known content if labeled stale. |

## Layout sketch

```text
┌──────────────────────────────────────────────────────────────────────┐
│ PageHeader: Overview                    [Environment▾] [Refresh]     │
├──────────────────────────────────────────────────────────────────────┤
│ Alert (optional page-level condition)                                │
│                                                                      │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────────────────────┐│
│ │ Card: Health  │ │ Card: Lag     │ │ Card: Connections             ││
│ │ [Badge ok]    │ │ 18 ms         │ │ active 12 · idle 3            ││
│ │ 4 / 4 up      │ │ p95           │ │ [View connections →]          ││
│ └───────────────┘ └───────────────┘ └───────────────────────────────┘│
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ Card: Needs attention                                            │ │
│ │ Table: Name | Issue | Since                                      │ │
│ │        … short rows …                                            │ │
│ │ EmptyState if none                                               │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

## When to use

- Product home / overview routes.
- Operator glance surfaces that link into deeper tools.

## When NOT to use

- The primary working surface for one entity — use [List-detail](list-detail.md).
- Long configuration forms — use [Settings](settings.md) or [CRUD](crud.md).
- A single full-height operational table — use list-detail / DataTable, not a
  one-widget "dashboard".

## Related patterns

- [Application shell](application-shell.md)
- [List-detail](list-detail.md) — drill-down target for "View all"
