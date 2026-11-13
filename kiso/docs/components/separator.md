# Separator

## Purpose

Separator draws a rule between adjacent content or controls. It can mark a
semantic section break when that boundary is not already expressed by markup.

## Anatomy

A single rule with no children. Use `orientation` to choose its axis and
`decorative` to choose whether it carries separator semantics.

## Variants

| Prop | Values | Meaning |
| --- | --- | --- |
| `orientation` | `horizontal` (default), `vertical` | Direction of the rule. |
| `decorative` | `true` (default), `false` | Visual-only rule or semantic content boundary. |

## Sizes

A horizontal rule is 1px high. A vertical rule is 1px wide and stretches along
the parent's cross axis; its container must provide a height. Both consume
`--color-border`. Spacing around the rule belongs to its parent.

## States

Static. No hover, focus, active, disabled, loading, or error state.

## Accessibility

With `decorative=true`, the rule has no separator semantics. Use this when
headings, sections, or groups already express the boundary.

Set `decorative=false` when the rule itself communicates a meaningful break
between content sections. Hiding that boundary would remove information for
screen-reader users. Radix supplies `role="separator"` and the appropriate
orientation semantics. Neither mode is focusable or resizable.

### Keyboard

No keymap and no tab stop.

## Terminal

In a terminal, Separator is `tui-kiso` `Separator`, the one concept for a
rule. Section rules in a `Page` and the rule between the parts of a `Card`
use the same stroke.

| Web | Terminal form |
| --- | --- |
| horizontal | The `Look` rule across the width: its pattern and ink, one row. |
| horizontal with a label | The label at the left in `muted-foreground`, then the rule to the end of the row. |
| vertical | One `│` per row, in `border`, down the height. Leave one free column each side. |

A separator draws only its own cells, so it works over a page and over a
`Card`. It has no keys and no focus. See
[terminal interfaces](../terminal-interfaces.md).

## When to use

- A quiet visual boundary between groups in a toolbar or detail view.
- A thematic break between content sections with `decorative=false`.

## When NOT to use

- A draggable pane boundary. Use [Split / Splitter](split.md).
- A box around a content unit. Use [Card](card.md).
- Every list row when spacing already makes the grouping clear.

## Radix/shadcn mapping

Uses Radix Separator, as does shadcn Separator. Kiso maps horizontal and
vertical orientations to its rule classes and defaults to decorative mode.
