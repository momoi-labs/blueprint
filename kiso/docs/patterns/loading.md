# Loading

Loading tells the person that requested work is in progress while preserving
context. Match the affordance to what is known: Skeleton for known structure,
Spinner only for indeterminate work whose result has no honest layout yet.

## Component composition

- [Skeleton](../components/skeleton.md) preserves known content geometry.
- [Table / DataTable](../components/table.md) composes Skeleton cells into
  rows. **Lists and tables use Skeleton rows, never a centered Spinner.**
- [Card](../components/card.md) keeps its frame and replaces known content with
  shaped Skeletons.
- [Spinner](../components/spinner.md) belongs in an indeterminate region or in
  a loading [Button](../components/button.md), not over a list.
- Keep [Search](../components/search.md) and
  [Pagination](../components/pagination.md) stable during a refetch when their
  current values are still meaningful.

Loading surfaces use `--color-background` or `--color-surface`; Skeleton uses
`--color-border`, while Spinner uses `--color-primary` and `--color-border`.
Motion consumes `--motion-duration-normal` and
`--motion-easing-standard`. Never invent raw placeholder dimensions; match
semantic type and spacing tokens.

## Flow

1. Start the request and set `aria-busy="true"` on the affected region.
2. Preserve stable chrome, headings, controls, and known dimensions.
3. Render Skeletons matching the content that will arrive. For a list, repeat
   a representative row rather than drawing one large block.
4. Announce one concise status such as “Loading queries…”, not one per row.
5. Swap placeholders for populated, empty, error, or permission-denied content
   in one update and clear the busy state.

For a pagination or filter refetch, keep the person's query and page context.
Prevent duplicate requests without presenting loading as disabled. If existing
rows remain safe to read, they may stay visible with the region marked busy;
otherwise replace only the rows with Skeleton rows.

## States

| State | Treatment |
| --- | --- |
| Initial loading | Known layout uses Skeletons; unknown layout may use a labeled Spinner. |
| Refetching | Keep controls and current context; replace or mark only the results region busy. |
| Empty | Remove Skeletons and show EmptyState. Never let placeholders linger as an empty result. |
| Error | Remove Skeletons and show the errors pattern. Retry returns to loading. |
| Permission denied | Stop loading and use the permission-denied pattern; do not retry indefinitely. |
| Loaded | Replace the loading presentation with real content in the same geometry. |

## Layout sketch

```text
PageHeader: Queries                         [Create query]
[Search queries________________] [Status v]       1–25 of 86
┌─────────────────────────────────────────────────────────┐
│ Name                 Owner                 Updated       │
├─────────────────────────────────────────────────────────┤
│ ███████████████      ███████               ██████████   │
│ ██████████           ██████████            ███████      │
│ █████████████        ██████                █████████    │
│ █████████            ████████              ██████       │
└─────────────────────────────────────────────────────────┘
Status: Loading queries…                  [Previous] [Next]
```

The blocks are decorative Skeleton cells aligned to final columns. Do not
replace this table body with a centered Spinner or erase its headers.

## Accessibility and copy

- Skeleton graphics are `aria-hidden="true"`; the containing region carries
  `aria-busy` and one polite status.
- Keep focus on the initiating control or stable page heading. Loading content
  does not enter the tab order.
- Under reduced motion, Skeletons stay static and Spinner uses a static graphic
  plus its label.
- State what is happening in direct language. Do not use chatty filler or
  promise a duration the system does not know.
