# Site page

A product's public page: its home page, a landing page or a release page. It
explains the product to someone who has not used it yet, and ends in one
action, such as Install.

## Purpose

A site page is read top to bottom, once. Each band answers one question: what
it is, how it works, what it costs, how to get it. The page is a stack of
[SiteSection](../components/site-section.md) bands between a
[SiteHeader](../components/site-header.md) and a
[SiteFooter](../components/site-footer.md). Kiso components inside the bands
show the product instead of describing it.

## Component composition

| Part | Component |
| --- | --- |
| Top bar | SiteHeader, `sticky`; `overlay` when the hero should run under it; `fold="hide"` when every section is on the page |
| Hero | SiteSection `size="lg"`, `center` body, SiteHeading `level={1}` `size="display"` with one primary Button |
| Section opening | [SiteHeading](../components/site-heading.md) with an eyebrow and a title |
| Product next to text | `split` body: SiteHeading, [FeatureList](../components/feature-list.md) and a Button on one side, the product on the other |
| A session or a screen | [WindowFrame](../components/window-frame.md), `terminal` for a shell |
| A printed document | [PerspectiveStack](../components/perspective-stack.md) of Cards |
| Short facts | [FeatureGrid](../components/feature-grid.md) |
| Live data | [Chart](../components/chart.md) `layout="spark"` in Cards, with one `syncId`, a `headline` and a `defaultPinned` moment |
| A command to run | [CodeBlock](../components/code-block.md) with `prompt="$"` and `copy="command"` |
| A prompt to paste into an agent | CodeBlock with `wrap` and `copy="prompt"` |
| Steps of a flow | [RadioGroup](../components/radio-group.md) `tiles` that switch a WindowFrame |
| Views of one tool | [Tabs](../components/tabs.md) `variant="pills"` with `keyHint`, above a WindowFrame |
| A band in another tone | SiteSection `tone="inverse"` or `"accent"` |
| A band that stands apart | SiteSection `variant="inset"` |
| A band with light behind it | SiteSection `glow` |

## Structure

1. SiteHeader.
2. Hero: who it is for, what it does in one sentence, one primary action.
3. Two to six sections, one question each. Alternate the side of `split`
   bodies, and use an `inverse` or `inset` band to break a long page.
4. Install or get started: the commands, the platforms, the primary action
   again.
5. SiteFooter.

Keep one primary Button per band. Other actions are ghost or default Buttons,
or links.

## Page and width

The bands span the window. Their content follows
[page layout](page-layout.md): a product may set `data-page-width` and
`data-page-align` on the page; without them, content keeps
`--size-content-max`, centered.

## Look

A product sets its look on `<html>` with the token axes in
[tokens](../tokens.md#neutrals-primary-action-and-typeface): an accent, a
neutral, a primary style and a typeface. pg-probe.dev is `gold`, `zinc`,
`contrast` and `dm-sans`, always dark. The components do not change.

## Responsive behavior

Bands respond to their own width, not the viewport's. Below 760px, `split`
and `grid` bodies stack, and SiteHeader folds its links and actions into a
menu. Terminal transcripts keep their lines and scroll sideways inside their
WindowFrame; the page itself never scrolls sideways.

## States

A site page is mostly static. Live examples keep their own states: a chart
with no data shows Chart's empty state, not a blank card. Examples that move
on their own, such as steps that advance, stop when the reader picks one and
do not move with reduced motion.

## Accessibility

- One `h1`, in the hero. Section titles are `h2`.
- Each band is a `section`; name it with its heading when landmarks matter.
- Examples in a WindowFrame or PerspectiveStack are pictures of the product.
  Keep their text short and true; do not put the only copy of a fact there.
- Copy actions announce their result through [Toast](../components/toast.md).

## Do not

- Do not use a site page for an application screen. Use
  [Application shell](application-shell.md) and a pattern of the product.
- Do not put screenshots where a Kiso component can show the real thing.
- Do not stack two `accent` bands, or put more than one in view at a time.
