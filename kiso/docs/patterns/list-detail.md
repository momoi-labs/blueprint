# List-detail

Master list plus a detail pane for one selected record. Navigation and context
stay consistent: the list remains visible (or recoverable), and the detail
shows the same entity the person selected.

User story #5.

## Purpose

Browse many similar entities, select one, and inspect or act on it without
losing list context. Typical Momoi uses: connections, instances, queries,
parameters.

**Canonical rule:** A list screen must not reinvent search, filters,
pagination, and empty state. Compose [Search](../components/search.md),
filtering controls, [Pagination](../components/pagination.md), and
[EmptyState](../components/empty-state.md) through
[Table / DataTable](../components/table.md) (and related components) — do not
invent a parallel list kit.

How Search, filters, sorting, and Pagination behave is specified elsewhere;
this layout pattern only places those controls consistently.

## Component composition

| Region | Compose with | Role |
| --- | --- | --- |
| Page chrome | [PageHeader](../components/page-header.md) | Page title, subtitle, primary create/import [Button](../components/button.md) |
| List toolbar | [Search](../components/search.md); optional filters via [Select](../components/select.md), [DropdownMenu](../components/dropdown-menu.md), and/or [Popover](../components/popover.md); optional bulk [Button](../components/button.md)s | Narrows the collection; owned by the list, not reinvented per product |
| List body | [Table / DataTable](../components/table.md) or a selectable list of rows | Master collection; row selection drives the detail |
| List paging | [Pagination](../components/pagination.md) | Below the table when the set is paged |
| Detail pane | content region, often a [Card](../components/card.md) or definition stack | Selected entity; may include [Tabs](../components/tabs.md), [Badge](../components/badge.md), [DropdownMenu](../components/dropdown-menu.md) for entity actions |
| Location | optional [Breadcrumb](../components/breadcrumb.md) | When the entity sits in a hierarchy deeper than Sidebar alone |
| Shell | [Application shell](application-shell.md) | Header + Sidebar + main around this page |

Tokens: list and detail panels use `--color-surface` on `--color-background`,
dividers `--color-border`, primary text `--color-foreground`, secondary
`--color-muted-foreground`, selection/current `--color-primary`, focus
`--color-focus`.

## Flow

1. Person opens the list route inside the application shell.
2. List loads; Search / filters / Pagination appear in their standard places
   when the collection supports them.
3. Selecting a row (or opening its Link) loads that entity in the detail pane
   or detail route while preserving list context.
4. Detail actions (edit, delete, connect) follow [CRUD](crud.md) and action
   patterns; they do not replace the list chrome.
5. Clearing selection returns focus to the list; changing Search/filters
   updates the list and clears or reconciles an obsolete selection.

Split view (list | detail) is preferred on wide viewports. On narrow
viewports, push detail as a full main view with an explicit back control
(Link or Button) that restores the list — same pattern, stacked presentation.

## States

| State | Behavior |
| --- | --- |
| loading (list) | Keep PageHeader and toolbar chrome; show Skeleton rows inside the table body — not a lone Spinner replacing the list. |
| loading (detail) | Keep the selected row highlighted; detail pane shows Skeleton for known structure. |
| empty (no items) | EmptyState in the list body with optional create action; detail pane hidden or shows a neutral prompt to select an item once items exist. |
| empty (no matches) | EmptyState explaining no matches; offer clear-filters action. Do not pretend the collection was never populated. |
| error (list) | Alert above or in place of the list body (what / why / now); retry Button; shell navigation remains. |
| error (detail) | Alert inside the detail pane; list stays interactive so the person can pick another row. |
| no selection | List visible; detail shows a short prompt ("Select a connection") — not an error, not EmptyState for the whole page. |

## Layout sketch

Wide (split):

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ PageHeader: Connections                              [Create connection]│
├──────────────────────────────────┬──────────────────────────────────────┤
│ List                             │ Detail                               │
│ [Search..............] [Filter▾] │ Connection · prod-eu                 │
│                                  │ [Badge: healthy]        [Actions ▾]  │
│ ┌──────────────────────────────┐ │                                      │
│ │ Name         Host      Status│ │ Host        db.example.com:5432      │
│ │ prod-eu ●    db.eu…    ok    │ │ User        app_readonly             │
│ │ staging      db.st…    warn  │ │ SSL         required                 │
│ │ analytics    db.an…    ok    │ │                                      │
│ └──────────────────────────────┘ │ [Edit]  [Test connection]            │
│ ← Pagination →                   │                                      │
└──────────────────────────────────┴──────────────────────────────────────┘
```

Narrow (stacked detail):

```text
┌──────────────────────────────────────┐
│ ← Connections                        │
│ PageHeader: prod-eu      [Actions ▾] │
│                                      │
│ Host     db.example.com:5432         │
│ User     app_readonly                │
│ ...                                  │
└──────────────────────────────────────┘
```

## List and detail as separate screens

An alternative to the split: the list is one screen and each record opens a
detail screen of its own. Use it when a record carries more than a pane can
hold, such as a form, a log, or a terminal. Its create screen is in
[CRUD](crud.md#create-screen).

### List screen

```tsx
<PageHeader actions={<Button size="sm" variant="primary">Deploy application</Button>}>
  <PageHeaderTitle>Applications</PageHeaderTitle>
</PageHeader>
<div className="list-filters">
  <Search aria-label="Search applications" />
  <Select>…</Select>
  {filtering ? <Button size="sm" variant="ghost">Clear filters</Button> : null}
</div>
<div className="table-wrap">
  <Table>…</Table>
  <div className="table-footer">3 of 12 applications</div>
</div>
```

- The one primary verb goes in PageHeader `actions`, not in the filter row.
  Narrowing a list and adding to it are opposite intentions.
- `.list-filters`: Search first and growing, a Select sized to its content,
  "Clear filters" only once something is filtered. Below 560px each control
  takes the row.
- The count goes in `.table-footer`, not above the table.
- From 1024px, a `.table-wrap` that is the last child of `.page` fills the
  height the header and filters leave: the rows scroll under the sticky
  header and the count stays on the bottom edge, as a detail card does. Set
  `data-fill="false"` on the `.table-wrap` to end the table with its last
  row instead.
- A small record is created in a [Modal / Dialog](../components/modal-dialog.md).

### Detail screen

```tsx
<div className="between">
  <PageHeader><PageHeaderTitle>paperless</PageHeaderTitle></PageHeader>
  <Lifecycle status={…} actions={…} destructive={…} />
</div>
<Card className="detail-tabs">
  <Tabs defaultValue="configuration">
    <TabsList aria-label="Application details">…</TabsList>
    <TabsContent value="configuration">
      <Form>
        <div className="form-body">…</div>
        <FormActions sticky>…</FormActions>
      </Form>
    </TabsContent>
    <TabsContent value="logs" className="detail-logs"><LogView>…</LogView></TabsContent>
  </Tabs>
</Card>
```

- The screen says its own name, and [Lifecycle](../components/lifecycle.md)
  sits beside it. The destructive action lives in that row, not at the foot
  of the form.
- One `Card.detail-tabs`, not a split. When the app reads facts back about
  the record, a Summary tab comes first.
- `Form` does not render `.form-body`; write it. A panel whose only child is
  the form gives its padding to `.form-body`, so a sticky
  [FormActions](../components/form-actions.md) spans the panel.
- A panel with its own scroller, a [LogView](../components/log-view.md) or a
  thread, takes `.detail-logs` or `.detail-pane` and reaches the card's edges.
- From 1024px, when the card is a direct child of `.page` inside an
  [AppShell](../components/app-shell.md), the shell stops at the viewport
  and the card takes the height the header leaves; each panel scrolls inside
  it. Below 1024px the document scrolls and an edge-to-edge panel is 60vh
  tall.

## When to use

- Collections where inspecting one item while keeping list context matters.
- Records with configuration and output of their own: use separate screens.
- Entities that share the same columns and detail shape.

## When NOT to use

- Single-record settings pages — use [Settings](settings.md).
- Dashboards of unrelated widgets — use [Dashboard](dashboard.md).
- Create/edit full-page forms with no master list — use [CRUD](crud.md).

## Related patterns

- [Application shell](application-shell.md) — outer frame.
- [CRUD](crud.md) — create/edit/delete of the selected entity.
