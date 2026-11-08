# PerspectiveStack

## Purpose

PerspectiveStack fans two or three pages or cards in depth, such as the cover
and a page of a printed report, so a site page shows a document without a
screenshot.

## Anatomy

```
PerspectiveStack (width)
└── item × 2 to 3: any element, usually a Card
```

```tsx
<PerspectiveStack width="18rem">
  <Card data-theme="dark">Cover</Card>
  <Card>Page 33 of 47</Card>
</PerspectiveStack>
```

The last child is in front. The items spread along a diagonal across 45% of
an item's width and turn a few degrees, so every item stays partly visible.

## Variants

None. `width` sets the item width, 22rem by default; items never grow past
the stack.

## Sizes

Items keep `width`. The stack pads its sides by 18%, so the fanned items stay
inside it. Cards in the stack are opaque, `--color-elevated-surface`, whatever
the panel fill, with a drop shadow in `--color-shadow-contact`.

## States

| State | Behavior |
| --- | --- |
| Rest | Items fanned, the last in front. |
| Hover or focus within | The item comes to the front and rises by `--spacing-sm`. With reduced motion it moves without a transition. |

## Accessibility

Items are read in source order, back to front. The fan is visual only. Do
not put actions only in a back item: it is partly covered until hovered or
focused.

### Keyboard

No keymap. Tab into an item to bring it forward.

## When to use

- Two or three pages of a document, or the screens of a flow, on a site page.

## When NOT to use

- Content the reader must read in full. Show it flat.
- More than three items, or a gallery. Use a grid.

## Radix/shadcn mapping

No Radix or shadcn primitive.
