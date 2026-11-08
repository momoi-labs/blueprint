# FeatureGrid

## Purpose

FeatureGrid lays out short facts side by side in joined cells: what a product
guarantees, the platforms it supports. Each cell has a title and a line or two
of detail.

## Anatomy

```
FeatureGrid: a Card
└── FeatureGridItem × 2 to 4
    ├── title
    └── description (children, optional)
```

```tsx
<FeatureGrid>
  <FeatureGridItem title="Read-only session">One connection with <code>default_transaction_read_only=on</code>.</FeatureGridItem>
  <FeatureGridItem title="Inspectable">The client can open the file before sending it.</FeatureGridItem>
</FeatureGrid>
```

## Variants

None. `titleAs` sets the title element: `h3` (default), `h2`, `h4` or `p`.

## Sizes

Cells are at least 13rem wide and share the row; they wrap when the grid
narrows. Each cell has `--spacing-lg` by `--spacing-xl` padding and a
`--color-border` line on its start and top edge, clipped inside the card. The
title uses `--type-size-body-large` and `--type-weight-medium`; the
description `--type-size-label` in `--color-muted-foreground`.

## States

None.

## Accessibility

The cells are a list (`role="list"` and `listitem`), so a screen reader
announces how many facts there are. Titles are headings at `titleAs`; pick a
level that follows the section's heading.

### Keyboard

No keymap.

## When to use

- Two to four short facts at the same level, such as guarantees or supported
  systems.

## When NOT to use

- Data a reader compares across rows. Use [Table](table.md).
- Facts about one object, as terms and values. Use [KV](kv.md).
- More than a sentence or two per fact. Use [FeatureList](feature-list.md) or
  prose.

## Radix/shadcn mapping

No Radix or shadcn primitive. The frame is Kiso's [Card](card.md).
