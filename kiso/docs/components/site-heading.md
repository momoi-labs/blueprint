# SiteHeading

## Purpose

SiteHeading opens a section of a site page: a short eyebrow, a title, an
optional description and optional actions. It is the same block in the hero
and in every section below it.

## Anatomy

```
SiteHeading (level, size, align)
├── eyebrow (optional)
├── title (required): h1, h2 or h3
├── description (optional)
└── actions (optional)
```

```tsx
<SiteHeading level={1} size="display" align="center" eyebrow="For people who work with PostgreSQL"
  title="Your client runs one command. You see the whole picture."
  description="pg-probe records PostgreSQL and host metrics into a single file."
  actions={<Button variant="primary">Install pg-probe</Button>} />
```

An `em` in the title takes `--color-link`, for a second line in the accent.

## Variants

| Prop | Values | Behavior |
| --- | --- | --- |
| `level` | `1`, `2` (default), `3` | The heading element. Use `1` once per page, for the hero. |
| `size` | `section` (default), `display` | `display` is the hero size. |
| `align` | `start` (default), `center` | `center` centers the block and its text. |

## Sizes

The eyebrow uses `--font-mono`, `--type-size-metadata`,
`--type-letter-spacing-caps`, uppercase, in `--color-link`. A `section` title
grows from `--type-size-display` to `--type-size-editorial`; a `display` title
from `--type-size-editorial` to 1.6 times it, with `--font-heading` and
`--type-weight-semibold`. The description uses `--type-size-body-large` and
`--color-muted-foreground`, at most 42rem wide. Slots are `--spacing-md`
apart; actions have `--spacing-md` more above them.

## States

None. The block is static text and the actions the product passes.

## Accessibility

The title is a real heading at `level`. Keep levels in order across the page:
one `h1`, then `h2` for sections. The eyebrow is a paragraph before the
heading, so it is read first; keep it short and do not repeat the title.

### Keyboard

No keymap. Actions keep their own.

## When to use

- The opening of a site page section, including the hero.

## When NOT to use

- A page title in an application. Use [PageHeader](page-header.md).
- A card title. Use [Card](card.md)'s title.

## Radix/shadcn mapping

No Radix or shadcn primitive.
