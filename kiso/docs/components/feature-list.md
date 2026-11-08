# FeatureList

## Purpose

FeatureList lists facts about a product, each with a short lead in the
foreground and its detail after it, marked by a short accent rule.

## Anatomy

```
FeatureList: ul
└── FeatureListItem: li
    ├── title (optional): the lead
    └── children: the detail
```

```tsx
<FeatureList>
  <FeatureListItem title="Cover and summary,">with a link to every chart.</FeatureListItem>
  <FeatureListItem title="Read-only SQL:">up to 1,000 rows.</FeatureListItem>
</FeatureList>
```

## Variants

None.

## Sizes

Items are `--spacing-md` apart. The rule is `--spacing-md` wide, in
`--color-link`, at the first line. The lead uses `--color-foreground` and
`--type-weight-medium`; the detail `--color-muted-foreground`.

## States

None.

## Accessibility

A native `ul`, so the count is announced. The rule is decoration drawn in CSS.
Write the lead and detail as one sentence, so the item reads well aloud.

### Keyboard

No keymap.

## When to use

- Three to five facts beside a picture of the product.

## When NOT to use

- Steps in order. Use [Steps](steps.md) or an ordered list.
- Facts side by side. Use [FeatureGrid](feature-grid.md).

## Radix/shadcn mapping

No Radix or shadcn primitive.
