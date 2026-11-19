# ListPage

The body of a list screen: a title with one action, filters, a table and a
count, with loading and empty states.

## Purpose

ListPage renders the list screen of the [CRUD](../patterns/crud.md) and
[List-detail](../patterns/list-detail.md) patterns in one call, so each list
has the same header, table frame and empty state. Put it inside
[ConsoleShell](console-shell.md) or another `.page`.

## Anatomy

```
ListPage
├── PageHeader
│   ├── PageHeaderTitle
│   └── action (primary Button)
├── filters (ready state only)
└── TableFrame
    ├── Table
    │   └── children (TableHeader, TableBody)
    └── .table-footer with count (ready state only)
```

In the empty state a [Card](card.md) with an [EmptyState](empty-state.md)
replaces the filters and the table.

## Props

| Prop | Type | Use |
| --- | --- | --- |
| `title` | string | The page title. |
| `action` | `PageAction` | `{ label, icon?, onClick?, href? }`. With `href` the action is a link. |
| `state` | `"loading" \| "empty" \| "ready"` | Which body to render. |
| `empty` | `{ title, text? }` | Copy for the empty state. |
| `filters` | node | Search or filter controls above the table. |
| `count` | string | Footer text, such as `2 of 3 clusters`. |
| `fill` | boolean | `true` lets the table take the height the header leaves. Defaults to `false`. |
| `width` | `"left" \| "center" \| "right" \| "full"` | Sets `data-width` on the body. Defaults to `full`. |
| `children` | node | Table rows and head. |

```tsx
<ListPage
  title="Clusters"
  action={{ label: "Create cluster", icon: <Plus className="icon" aria-hidden="true" />, onClick: create }}
  state={clusters.length ? "ready" : "empty"}
  empty={{ title: "No clusters yet", text: "A cluster appears here once you create one." }}
  filters={<Search aria-label="Search clusters" value={query} onChange={filter} />}
  count={`${rows.length} of ${clusters.length} clusters`}
>
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
</ListPage>
```

## States

| State | Behavior |
| --- | --- |
| loading | The table frame holds a [Skeleton](skeleton.md) row. Filters and count wait. |
| empty | A Card with EmptyState. The action stays in the header. |
| ready | Filters, table and count. |

## Accessibility

The title is the page's `<h1>`. Give the filters an accessible name, such as
`aria-label` on [Search](search.md). The action label states the verb and
the object.

## When to use

- For the list screen of a collection with one primary action.

## When NOT to use

- When the list and the detail share one screen; use
  [Split](split.md) as in [List-detail](../patterns/list-detail.md).
- When the page needs several actions or a description; compose
  [PageHeader](page-header.md) and [Table](table.md).

## Radix/shadcn mapping

No Radix or shadcn equivalent. ListPage composes Kiso PageHeader, Table,
Card, EmptyState and Skeleton.
