# EmptyState

A deliberate placeholder when a region has nothing to show. It explains
why the space is empty and may offer a next action.

## Purpose

EmptyState replaces an expected list, table body, or collection when there
are zero items — either because the person has never created any, or because
filters/search matched none.

User story #13: the action is **optional**. Informational-only EmptyStates are
valid when there is nothing useful to do yet.

### Choose the right empty

| Situation | Control | Why |
| --- | --- | --- |
| Zero items in a collection / table body | **EmptyState** | Explains emptiness; optional create/clear action. |
| Still loading | [Skeleton](skeleton.md) | Not empty — pending. |
| Failed to load | [Alert](alert.md) | Error, not emptiness. |
| A single field with no value | Placeholder / HelperText | Not a page-level empty. |

[Table / DataTable](table.md) composes EmptyState for its empty data state.

## Anatomy

```
EmptyState
├── Illustration / icon (optional)
├── Title (required)
├── Description (optional; recommended when the title is not enough)
└── Action (optional: Button or Link)
```

- **Illustration / icon.** Optional. Decorative (`aria-hidden`) when Title
  carries the meaning. Prefer a simple icon over a large marketing
  illustration in product UI.
- **Title.** What is empty, in product language ("No replicas yet", "No
  queries match"). Follow [voice-and-tone](../voice-and-tone.md).
- **Description.** One or two short sentences: why, and what to do if there
  is no Action control.
- **Action.** Optional [Button](button.md) (create, import, clear filters)
  or [Link](link.md) when the next step is navigation. Never required.

## Variants

| Variant | When | Action |
| --- | --- | --- |
| `first-run` | The collection has never had items. | Usually a primary Button ("Create replica"). |
| `no-results` | Filters or Search exclude everything. | Often "Clear filters" (default/ghost) or adjust Search; not "Create". |
| `informational` | Empty is expected and there is no useful action. | No Action. Title + Description only. |

Do not add severity variants (info/warning/error). Emptiness is not an
error — errors are Alert. Do not color the whole EmptyState with status
tokens.

Surface tokens: text `--color-foreground` / `--color-muted-foreground` on
the surrounding `--color-surface` or `--color-background`. Icon uses
`--color-muted-foreground` unless it is purely decorative brand chrome.

## Sizes

| Size | Use | Tokens |
| --- | --- | --- |
| `md` (default) | Table bodies, Card content, list panels. | Title `--type-role-heading` or label emphasis; description `--type-role-body`; padding `--spacing-lg`; gap `--spacing-sm`. |
| `sm` | Narrow side panels or compact nested regions. | Tighter padding `--spacing-md`; smaller icon; same type roles if readable. |

Action Buttons use Button `md` by default; `sm` only inside `sm` EmptyState
in dense chrome. Do not invent an `lg` EmptyState that competes with
PageHeader.

## States

| State | Behavior |
| --- | --- |
| default | Visible empty region. |
| hover / focus / active | EmptyState itself is not a control. Focus goes to Action if present. |
| disabled | N/A. Hide the region or show a different state. |
| loading | Do not show EmptyState while loading — use Skeleton. If the Action triggers creation, that Button may enter loading. |
| error | Not an EmptyState state. Switch to Alert. |

## Accessibility

- EmptyState is a region with an accessible name from Title
  (`aria-labelledby`) and optional `aria-describedby` for Description.
- Prefer landmark/region semantics only when the empty area is a major
  page section; inside a table body, keep table structure and place
  EmptyState content in a single full-width cell or a documented
  replacement region announced as the table's status.
- Icon/illustration: `aria-hidden="true"` when Title is present.
- Action is a real Button or Link with its own accessible name. Do not make
  the entire EmptyState clickable.
- When EmptyState appears because Search filtered everything, ensure the
  Search field remains reachable and that the empty message is findable
  by screen reader users (polite live update only if the change is not
  obvious from focus).

### Keyboard

| Key | Action |
| --- | --- |
| `Tab` / `Shift+Tab` | Reach the Action if present. |
| `Enter` / `Space` | Activate the focused Action. |

## When to use

- A list, table body, or collection has zero items to show.
- First-run onboarding for a createable resource (with Action).
- No Search/filter matches (with copy that reflects filters).
- Informational empty when no action exists (user story #13).

## When NOT to use

- **Loading.** Skeleton (or Spinner for indeterminate non-layout waits).
- **Errors.** Alert with retry.
- **Permission denied.** Alert or a dedicated locked state — not "No items".
- **Marketing empty.** Product EmptyState is operational, not a billboard.
- **Replacing a whole app shell.** Page-level emptiness still sits inside the
  shell; do not delete navigation to show EmptyState.

## Tokens

`--color-foreground`, `--color-muted-foreground`, `--color-surface` /
`--color-background`, optional icon `--color-muted-foreground`, spacing /
type / radius / motion semantic tokens only. Action consumes Button/Link
tokens. No raw hex/px.

## Radix/shadcn mapping

No Radix EmptyState primitive.

| Kiso | Reference |
| --- | --- |
| Composition pattern | shadcn has no dedicated Empty component in core; compose layout + typography + [Button](button.md) like common "empty" blocks in shadcn Data Table examples |
| Action | shadcn / Kiso [Button](button.md) or [Link](link.md) |
| Inside tables | shadcn Data Table empty row patterns → replace with this anatomy |

Do not copy illustration-heavy marketing empties. Keep Kiso EmptyState
quiet and actionable.
