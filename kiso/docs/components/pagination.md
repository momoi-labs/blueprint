# Pagination

Moves through explicit pages or indicates progress through a bounded sequence.

## Purpose

Pagination exposes position and direct page navigation when page numbers help
the person reason about a dataset. It composes with Table/DataTable; it does
not replace filtering or Search. Its step indicator variant exposes position
in a sequential workflow without making progress itself.

## Anatomy

```
Pagination navigation
├── Previous control
├── page Link(s)
├── ellipsis (optional, non-interactive)
├── Next control
└── result summary (optional)
```

Use Link for URL-addressable pages and Button only for a client-side dataset
whose URL intentionally does not change. Apply `--color-primary`,
`--color-foreground`, `--color-border`, `--color-disabled`, and
`--color-focus`, plus semantic spacing and type tokens.

## States

| State | Behavior |
| --- | --- |
| default | Page destinations and previous/next are available. |
| hover | Interactive page control owns hover feedback. |
| focus | Focused control shows `--color-focus`. |
| active | Current page has `aria-current="page"`; activation loads the target page. |
| disabled | Previous/next at a boundary is unavailable and uses `--color-disabled`; page Links are never disabled. |
| loading | Keep position visible, mark the results region `aria-busy="true"`, and prevent duplicate requests without erasing controls. |

## Accessibility

Use `<nav aria-label="Pagination">`. Give controls names such as “Go to page
4”, “Previous page”, and “Next page”; the visible numeral alone is not enough.
Ellipses are not focusable. After a page change, move focus to the results
heading or announce the updated range in a polite live region. Native Link or
Button keyboard behavior applies.

## Step indicator variant

Pagination supports a step indicator variant for a bounded, sequential flow,
as required by user story 17 in
[epic #3](https://github.com/momoi-labs/blueprint/issues/3). This variant reuses
Pagination's ordered navigation shape and tokens, but steps are workflow
states, not dataset pages. It does not add a separate multi-step pattern.

### Semantics and anatomy

```
Step indicator navigation
└── ordered list
    └── step (one or more)
        ├── position or status marker
        ├── label
        └── supporting text (optional)
```

Keep every step visible so the person can understand their position and the
remaining work. Use concise task labels rather than page numbers alone. The
indicator communicates progress; Button controls such as “Back” and
“Continue” perform the workflow actions and remain outside it.

### States

| State | Behavior |
| --- | --- |
| upcoming | Identifies work not yet reached. It is non-interactive unless the flow explicitly allows skipping ahead. |
| current | Identifies the active step with `aria-current="step"`; only one step is current. |
| completed | Identifies a successfully completed step. It may be interactive when revisiting completed work is safe. |
| error | Identifies a visited step that needs attention without relying on color alone. |
| disabled | An unavailable step remains legible but cannot be activated; prefer non-interactive text over a disabled Link. |

Do not infer completion from the current position: a person may return to a
completed step, and a visited step may contain an error. Pair icons and colors
with text or accessible names such as “Completed: Account details”.

### Accessibility and keyboard behavior

Wrap the ordered list in `<nav aria-label="Form progress">` and expose the
current item with `aria-current="step"`. Include the step position in its
accessible name when it is useful, for example “Step 2 of 4: Permissions,
current step”. Decorative connectors and status icons are hidden from
assistive technology.

Render navigable steps as native Links when each step has a URL, or Buttons
when navigation is intentionally client-side. `Tab` moves through only those
interactive steps; `Enter` activates a Link, and `Enter` or `Space` activates
a Button. Non-interactive current, upcoming, and disabled steps do not enter
the tab order. Do not add arrow-key behavior unless the indicator is built
from another component whose documented semantics require it. After a step
change, move focus to the new step's heading and announce validation errors
before blocking “Continue”.

## When to use

- A known dataset where people benefit from page position or direct jumps.
- Table/DataTable results that are expensive or impractical to load at once.
- A bounded multi-step flow where people benefit from seeing their progress.

## When NOT to use

- An unbounded activity stream; use incremental loading.
- A small dataset that fits comfortably on one page.
- To hide missing Search or filtering.

## Radix/shadcn mapping

No Radix Pagination primitive. Use shadcn Pagination as a structural reference
with native Links and Kiso tokens; do not copy utility colors or raw sizes.
