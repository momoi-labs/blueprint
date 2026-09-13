# Disclosure

## Purpose and anatomy

Collapse a related section without leaving the page. A native `details`
contains a `summary` and content region. `summary` provides the visible name;
children provide the section content. Do not put links or buttons inside the
summary. Multiple sections may remain open independently.

## States and behavior

Closed is the default. Pass native `open` to start open. The browser maintains
open and closed states and dispatches `onToggle`. Closed content remains in
the document but is hidden and removed from keyboard navigation. Preserve
application state inside the content; opening does not fetch data by itself.

## Accessibility

Use native semantics and the browser's disclosure marker. Tab reaches the
summary; Enter or Space toggles it and focus stays there. Content follows the
summary in DOM order. Keep heading levels appropriate to the surrounding page.
On a coarse pointer, the summary is at least the minimum touch target height.
Do not animate the content or add redundant expanded-state ARIA.

## Tokens and implementation

Spacing uses `--spacing-sm`; the summary uses `--type-weight-medium`.
Focus uses `--color-focus`. Touch targets use `--size-touch-min` only inside
`@media (pointer: coarse)`. Native details needs no Radix dependency.
