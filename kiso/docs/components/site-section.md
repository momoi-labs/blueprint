# SiteSection

## Purpose

SiteSection is one full-width band of a site page: a product home page, a
landing page or a release page. A site page is a stack of them. Kiso
components go inside, and the band's tone recolors everything they draw.

## Anatomy

```
SiteSection (tone, size, variant)
├── SiteSectionHead (optional): a SiteHeader or Tabs at the top
├── SiteSectionBody (layout, columns, ratio): the content
└── SiteSectionFoot (optional): Tabs or links at the bottom
```

The body and the foot wrap their children in an inner column. The column
follows [page layout](../patterns/page-layout.md): with `data-page-width`, the
page width and alignment settings decide it; without them, it keeps
`--size-content-max`, centered. The gutter grows from `--spacing-xl` to
`--spacing-4xl` with the viewport.

```tsx
<SiteSection tone="inverse">
  <SiteSectionBody layout="split" ratio="1:2">
    <SiteHeading eyebrow="How it works" title="Capture there. Analyze here." />
    <RadioGroup label="Step" variant="tiles" ... />
    <WindowFrame variant="terminal" title="ssh db-prod-01">{transcript}</WindowFrame>
  </SiteSectionBody>
</SiteSection>
```

## Variants

| Prop | Values | Behavior |
| --- | --- | --- |
| `tone` | `default`, `inverse`, `accent` | `default` uses the page colors. `inverse` flips the color scheme, so a light page gets a dark band and the reverse. `accent` paints the band in `--color-primary` and remaps foreground, muted text, borders, links and the primary Button so they stay readable on it. |
| `variant` | `band`, `inset` | `band` is edge to edge. `inset` frames the body in a [Card](card.md) panel inside the column. The panel follows the border, corner and shadow appearance. |
| `glow` | none, `top`, `start`, `end` | A soft light in `--color-primary` at 14%, from the top center or from one side, behind the band's content. |
| `layout` (body) | `stack`, `center`, `split`, `row`, `grid` | `stack` puts children one below another. `center` centers them and their text. `split` makes two columns, `ratio` `1:1`, `1:2` or `2:1`. `row` puts children on one line, spaced apart. `grid` makes `columns` equal columns, 2, 3 or 4. |

A [SiteHeading](site-heading.md) placed straight in a `split` or `grid` body
spans every column. In `grid`, the last child of each item sits at the bottom,
so links and actions line up across items.

## Sizes

| `size` | Block padding of the body |
| --- | --- |
| `sm` | `--spacing-2xl` |
| `md` (default) | `--spacing-3xl` to one and a half times `--spacing-4xl`, with the viewport |
| `lg` | `--spacing-4xl` to two and a half times `--spacing-4xl` |
| `half` | `md`, and at least half the viewport height |
| `full` | `md`, and at least the viewport height |

Below 760px of section width, `split` and `grid` stack into one column. The
width is the section's, not the viewport's, so a section in a preview pane or
a narrow column stacks too.

## States

SiteSection has no state of its own. The components inside keep theirs.

## Accessibility

The root is a `section`. Give it a name with `aria-labelledby` pointing at its
heading when the page has more than one landmark of the kind. Tone does not
change meaning: the text and controls inside meet contrast in every tone,
because the tone changes the tokens, not single colors.

### Keyboard

No keymap. Reading order is the source order; `split` and `grid` do not
reorder children.

## When to use

- A home, landing or release page, built as a stack of bands.
- A band that needs another tone than the page: a contrast band or a closing
  call to action.

## When NOT to use

- A panel inside an application screen. Use [Card](card.md) or a
  [page](../patterns/page-layout.md).
- A dashboard. Use [DashboardGrid](dashboard-grid.md).

## Radix/shadcn mapping

No Radix or shadcn primitive. The model is Bulma's hero, with a head, a body
and a foot, applied to every band of the page.
