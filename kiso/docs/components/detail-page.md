# DetailPage

The body of a detail screen: a title with an optional action, and tabs in a
card, each with content or an empty state.

## Purpose

DetailPage renders the detail screen of the
[List-detail](../patterns/list-detail.md#list-and-detail-as-separate-screens)
pattern. Each tab holds one view of the record. A tab with no data shows an
[EmptyState](empty-state.md) instead of blank space.

## Anatomy

```
DetailPage
├── PageHeader
│   ├── PageHeaderTitle
│   └── action (optional primary Button)
└── Card.detail-tabs[data-fill="false"]
    └── Tabs
        ├── TabsList
        │   └── TabsTrigger per tab
        └── TabsContent per tab
            └── content or EmptyState
```

## Props

| Prop | Type | Use |
| --- | --- | --- |
| `title` | string | The record's name. |
| `action` | `PageAction` | Optional `{ label, icon?, onClick?, href? }`. |
| `tabs` | `DetailTab[]` | `{ value, label, content?, empty? }`. A tab with `empty` shows EmptyState. |
| `tabsLabel` | string | Accessible name of the tab list. Defaults to `<title> details`. |
| `value` | string | The open tab, when the product controls it, for example from the URL. |
| `onValueChange` | function | Runs when the reader picks a tab. |
| `fill` | boolean | `true` lets the card take the height the header leaves. Defaults to `false`. |
| `width` | `"left" \| "center" \| "right" \| "full"` | Sets `data-width` on the card. Defaults to `full`. |

```tsx
<DetailPage
  title="main"
  action={{ label: "Edit cluster", icon: <Pencil className="icon" aria-hidden="true" />, href: "/clusters/main/edit" }}
  value={tab}
  onValueChange={setTab}
  tabs={[
    { value: "overview", label: "Overview", content: <KV>...</KV> },
    { value: "events", label: "Events", empty: { title: "No events yet" } },
  ]}
/>
```

## States

| State | Behavior |
| --- | --- |
| tab with content | The tab's content. |
| empty tab | EmptyState with the tab's `empty` copy. |
| uncontrolled | Opens the first tab and keeps the choice inside the component. |
| controlled | `value` and `onValueChange` let the URL keep the tab. |

## Accessibility

The title is the page's `<h1>`. [Tabs](tabs.md) give arrow-key movement
between triggers and link each trigger to its panel. Name the tab list when
the page has more than one.

## When to use

- For a record that has several views, such as overview, members and events.

## When NOT to use

- For a record with one view; use [PageHeader](page-header.md) and the view
  in the page.
- For status and lifecycle verbs; add a [Lifecycle](lifecycle.md) row with
  PageHeader and Tabs instead.

## Radix/shadcn mapping

No Radix or shadcn equivalent. DetailPage composes Kiso PageHeader, Card,
Tabs (Radix Tabs) and EmptyState.
