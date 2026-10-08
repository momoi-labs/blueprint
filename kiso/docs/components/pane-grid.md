# PaneGrid / GridPane

## Purpose

PaneGrid arranges the summary panes of one object, an application or a
service, on twelve columns, and lets the reader change that arrangement. A
pane is resized at its end edge and moved by its title. The product saves the
result and restores it next time.

[DashboardGrid](dashboard-grid.md) owns a fixed layout the product designed.
PaneGrid owns a layout the reader designs. [Split](split.md) allocates width
between two panes of one workspace; PaneGrid places many panes on rows.

## Anatomy

```
PaneGrid
├── Title (optional)
├── Row
│   ├── GridPane
│   │   ├── Head: grip, Title, Actions (optional)
│   │   ├── Body
│   │   └── Resizer
│   └── GridPane …
└── Row …
```

A row is a group of panes. Its panes flow in reading order onto as many lines
as they need, so a row whose panes add up to more than twelve columns wraps
onto a second line and stays one row. A pane may start a row with `newRow`.
Rows and columns share one gap. While a pane is dragged, a dashed rule
appears in the gap above each row: dropping on it starts a row.

GridPane is a [Card](card.md). Its head is the drag handle and holds the h3
title and optional compact actions ([Button](button.md) `sm`, `ghost`, or
[IconButton](icon-button.md)). Its body holds the payload: a [KV](kv.md), a
short [Table](table.md), a code block, a [Stat](stat.md).

## Sizes

Every size is a number of columns out of twelve, stored by pane id.

| Prop | Default | Contract |
| --- | --- | --- |
| `min` | `1` | Narrowest width. Resizing and the compact scale respect it. |
| `size` | `6` | Width when the grid has no saved size for the pane. |
| `newRow` | `false` | Start a row when the grid has no saved place for the pane. |

A pane grows into the free columns of the line it sits on, and no further. On
a line holding a pane of six and a pane of four, the first grows to eight. A
move never changes a size: the pane keeps the width it was given until the
reader resizes it.

## Layout

```ts
type PaneGridLayout = { rows: string[][]; sizes: Record<string, number> }
```

`rows` lists pane ids by row in reading order. `sizes` maps each id to its
width. PaneGrid keeps its own layout, seeded from the children's `size` and
`newRow`, or from `defaultLayout`. Pass `layout` to control it. In either
case `onLayoutChange` reports every change; the product persists the value
and restores it as `defaultLayout` or `layout`.

A pane missing from a layout joins the last row, or starts a row if it asks
to. An id in the layout without a pane is ignored. A size below the pane's
`min` is raised to it.

## Options

| Prop | Default | Contract |
| --- | --- | --- |
| `overflow` | `wrap` | `wrap` breaks a row wider than twelve columns onto more lines. `scroll` keeps it on one line that scrolls horizontally, up to `scrollPages` screens wide; a resize or a drop beyond that is refused. |
| `scrollPages` | `2` | How many screens a scrolling row may span. |
| `fill` | `false` | Hand each line's leftover columns to its panes, on screen only. Sizes do not change. |
| `pack` | `false` | Order each row's panes by size, largest first, so lines fill up. Ignored with `overflow="scroll"`. The DOM keeps the row order. |
| `debug` | `false` | Label every row with its columns, draw each line's free columns, and show each pane's size, minimum and maximum in its head. A development aid; not for readers. |

A scrolling row uses the grid's own column tracks, so its columns stay
aligned with the rows above and below it.

## Responsive behavior

PaneGrid follows the viewport, at DashboardGrid's breakpoints.

| Width | Columns | Editing |
| --- | --- | --- |
| above 1024px | 12 | Resize and move. |
| 641px to 1024px | 6 | Move only. Sizes and minimums are halved, rounding up. |
| up to 640px | 1 | Move only, up and down. Every pane spans the column. |

The compact scales never write to the layout. A reader edits the layout on
the wide screen it was designed for.

## States

| State | Behavior |
| --- | --- |
| hover on the resizer | The hairline takes `--color-ring` and the column-resize cursor. |
| resizing | Pointer capture keeps the resize active until release. The pane shows a ring. |
| at a bound | Further movement leaves the size unchanged. The resizer is `aria-disabled` when min and max meet. |
| moving | The dragged pane fades. The rules between rows appear. A bar shows where it will land: between two panes, or across the grid for a new row. |
| refused drop | The bar takes `--color-danger`. Releasing leaves the layout unchanged. |
| focus | The head and the resizer show the focus indicator. |

No loading, empty or error state. Each pane's content owns those.

## Accessibility

The head is a focusable `role="button"` named "Move {title}". The resizer is
a focusable `role="separator"` with `aria-orientation="vertical"`,
`aria-valuemin`, `aria-valuemax`, `aria-valuenow`, named "Resize {title}".
Controls in the head's actions are ordinary buttons; pressing them does not
start a move. DOM order follows row order, so reading order, focus order and
visual order agree. With `pack`, the visual order within a row may differ.

### Keyboard

| Focus | Key | Result |
| --- | --- | --- |
| Head | ArrowLeft / ArrowRight | Swap the pane with the one before or after it. |
| Head | ArrowUp / ArrowDown | The same, when panes stack. |
| Head | Enter / Space | Start a row with this pane and the panes after it, or rejoin the row above when the pane is already first. |
| Resizer | ArrowLeft / ArrowRight | One column narrower or wider. |
| Resizer | Home / End | The minimum or the maximum. |

## Tokens and composition

Gaps use `--presentation-grid-gap`. The head's padding uses
`--presentation-panel-padding`; the body follows Card. The resizer and the
drop bar use `--color-ring`; a refused drop uses `--color-danger`; the rule
between rows uses `--color-border-strong`. The pane is a Card and follows
every appearance setting.

Compose under the [Dashboard pattern](../patterns/dashboard.md) for an
object's summary. Give the section an `aria-label` or a `title`.

## When to use

- A summary screen whose reader decides what deserves the most room.
- Several independent facts about one object, each with its own pane.

## When NOT to use

- A fixed overview the product designs. Use [DashboardGrid](dashboard-grid.md).
- Two panes that share one workspace. Use [Split](split.md).
- A list of records. Use [Table](table.md).

## Radix/shadcn mapping

No Radix primitive. shadcn Resizable is a reference for the handle only;
PaneGrid owns its columns, rows and the move.
