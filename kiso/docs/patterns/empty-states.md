# Empty states

Use an empty state when a collection or bounded region has no content to show.
It is a successful, known result—not loading, failure, or denied access.

## Component composition

- [EmptyState](../components/empty-state.md) owns the title, description, and
  optional action.
- Use [Button](../components/button.md) when the action changes the current
  view, such as creating a record or clearing filters.
- Use [Link](../components/link.md) when the next step navigates elsewhere.
- In a [Table / DataTable](../components/table.md), keep useful headers and
  place EmptyState in the body region. A list screen must not reinvent search,
  filters, pagination, and empty state.

The surrounding region uses `--color-background` or `--color-surface`.
EmptyState copy uses `--color-foreground` and `--color-muted-foreground`;
actions retain their component tokens. Do not use a status color: empty is not
an error or warning.

## Flow

1. Resolve the collection request before deciding that it is empty.
2. Distinguish first use, no matches, and expected informational emptiness.
3. State what is empty and why, when the reason is useful.
4. Offer one next action only when the person can change the state.
5. After the action, move to loading, then populated, empty, or error based on
   the result.

The action is optional. Do not add a disabled or dead-end action merely to
balance the layout. Informational copy is complete when no useful action exists.

| Situation | Copy and action |
| --- | --- |
| First use | “No queries yet. Create your first query to see it here.” + **Create query** Button. |
| No matches | “No queries match these filters.” + **Clear filters** Button when filters can be reset. |
| Informational | “No completed runs in this period.” No action when the person cannot produce one here. |

## States

| State | Treatment |
| --- | --- |
| Loading | Do not show EmptyState. Preserve the region with Skeleton; lists use Skeleton rows. |
| Empty | Show the matching EmptyState variant with an optional Button or Link. |
| Error | Replace the empty treatment with the errors pattern and Alert. A failed request is not zero records. |
| Permission denied | Use the permission-denied pattern. Do not imply the protected collection is empty. |
| Populated | Replace EmptyState with the collection without moving surrounding controls. |

## Layout sketch

```text
PageHeader: Queries                         [Create query]
Search / filters / result count remain in place
┌─────────────────────────────────────────────────────────┐
│ Name                 Owner                 Updated       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    No queries yet                       │
│       Create your first query to see it here.           │
│                    [Create query]                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

For no matches, keep Search and filters visible and replace the central action
with **Clear filters**. For informational emptiness, omit the action row.

## Accessibility and copy

- Give the region an accessible name from the EmptyState title. Announce a
  change to no results politely when it follows search or filtering.
- Do not make the whole empty region interactive. Keyboard focus reaches the
  Button or Link only.
- Follow [voice and tone](../voice-and-tone.md): what is empty, why when useful,
  and what to do. Avoid jokes, apologies, and terminal flourish.
