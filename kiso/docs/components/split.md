# Split / Pane / Splitter

## Purpose

Split places related content side by side and lets the reader allocate width
between panes. Use it for a list and its detail, or configuration beside logs.
Two [Cards](card.md) group separate content; Split expresses a shared workspace
whose divider changes the space available to each side.

## Anatomy

```
Split
├── Pane (sized by Splitter)
├── Splitter
└── Pane (fills remaining space)
```

Keep the parts as direct siblings. Splitter owns the size and writes a
percentage `flex-basis` onto the preceding Pane. The second Pane must fill
the remaining width, using the `grow` class in the React composition. Pane has
a zero minimum width and owns overflow scrolling. The product sets the layout
height and pane padding.

## Variants

One horizontal arrangement of panes with a vertical divider. There is no
orientation prop or stacked resize mode. Omitting Splitter produces a static
split whose sizes belong to the product.

## Sizes

| Splitter prop | Default | Contract |
| --- | --- | --- |
| `defaultSize` | `50` | Initial preceding-pane basis, as a percentage of Split width. |
| `min` | `25` | Lower bound for resize operations, in percent. |
| `max` | `75` | Upper bound for resize operations, in percent. |
| `step` | `2` | Percentage points moved by each arrow key press. |

Supply bounds within 0 to 100, `min <= defaultSize <= max`, and a positive
`step`. The initial value is used as supplied; resize operations clamp to the
bounds. `defaultSize` initializes internal state and is not a controlled size
prop. `onSizeChange(size)` reports changed percentages for optional product
persistence; the product can restore a saved value as `defaultSize` on mount.

The divider is 1px wide with an expanded pointer area. It consumes
`--color-border`, changing to `--color-ring` on hover or drag.

## States

| State | Behavior |
| --- | --- |
| default | The preceding Pane uses the current percentage. |
| hover | The divider highlights and shows the column-resize cursor. |
| dragging | Pointer capture keeps resizing active outside the divider until release or cancellation. |
| focus | The divider remains keyboard operable and must have a visible focus indicator. |
| at a bound | Further movement toward that bound leaves the size unchanged. |

No disabled, loading, or error state. Content inside each Pane owns those states.

## Accessibility

Splitter is a focusable `role="separator"` with `aria-orientation="vertical"`.
It exposes `aria-valuemin`, `aria-valuemax`, and a rounded `aria-valuenow`.
Its default accessible name is "Resize panes"; use a more specific `aria-label`
when the page has several splits. Keep the separator exposed to assistive
technology. A resizable divider is not decorative.

### Keyboard

| Key | Result |
| --- | --- |
| Tab | Focus or leave the divider in normal tab order. |
| ArrowLeft / ArrowRight | Decrease / increase the preceding Pane by `step`. |
| Home / End | Set the preceding Pane to `min` / `max`. |

## When to use

- A list-detail workspace where the reader needs more room on either side.
- Configuration and output that remain visible together.

## When NOT to use

- Independent summary tiles. Use Cards in a grid.
- A static dividing rule. Use [Separator](separator.md).
- A narrow viewport that cannot fit both panes. The product must choose an
  appropriate single-pane flow; Split does not collapse automatically.

## Radix/shadcn mapping

No Radix resize primitive. shadcn Resizable is a behavioral reference, but
Kiso's Splitter owns its percentage directly. It does not expose panel-group
state, vertical layouts, or collapsible panels.
