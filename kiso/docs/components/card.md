# Card

Groups related content with visual separation from the surrounding canvas.

## Purpose

Card is a surface for one unit of related content: a cluster of fields, a
summary of a replica, a setting group, a login form. It creates hierarchy by
sitting on `--color-surface` against `--color-background`.

It is not a status label ([Badge](badge.md)), not an in-page warning
([Alert](alert.md)), and not a layout primitive for the whole app (Header,
Sidebar, PageHeader belong to a later slice).

User story #18: Badge labels status; Card groups content.

## Anatomy

```
Card
├── media (optional, edge-to-edge at the start)
├── Header (optional)
│   ├── Title
│   ├── Description
│   └── Action (optional: Button, IconButton, Badge, or Link)
├── Content (optional if Header/Footer already carry the payload)
└── Footer (optional: actions or supporting meta)
```

Every part except the root is optional, but a Card with no content is
decorative and does not belong. Prefer Title + Content as the minimum useful
shape.

- **Title.** Use the heading typography properties (`--type-role-heading-font-family`,
  `--type-role-heading-font-size`, `--type-role-heading-font-weight`,
  `--type-role-heading-letter-spacing`, `--type-role-heading-line-height`) only
  when the Card is a true section; otherwise use the equivalent five
  `--type-role-label-font-family`, `--type-role-label-font-size`,
  `--type-role-label-font-weight`, `--type-role-label-letter-spacing`, and
  `--type-role-label-line-height` properties. One title.
- **Description.** Use the five body typography properties or the five metadata
  typography properties listed in `tokens/build/tokens.css`. Secondary;
  `--color-muted-foreground`.
- **Action.** One compact control aligned with the title — not a toolbar.
- **Content.** The payload. Default type uses `--type-role-body-font-family`,
  `--type-role-body-font-size`, `--type-role-body-font-weight`,
  `--type-role-body-letter-spacing`, and `--type-role-body-line-height`; color
  uses `--color-foreground`.
- **Footer.** Actions that apply to the whole Card, typically
  [Button](button.md) `sm` / `md`.

## Variants

| Variant | When | Tokens |
| --- | --- | --- |
| `plain` (default) | Grouping on the page canvas. | Background `--color-surface`, border `--color-border`, radius `--radius-lg`, padding `--spacing-lg`. No shadow. |
| `elevated` | The grouping must lift above nearby surfaces (a floating picker, a featured summary). | Background `--color-elevated-surface`, border `--color-border`, shadow `--shadow-sm`. Same radius and padding. |

Default is `plain`. Tokens.md assigns `--color-surface` to "cards, panels,
and table rows" and `--color-elevated-surface` to "menus, popovers, and
dialogs". Use `elevated` only when the Card is competing with other surfaces
and needs that lift — not on every tile.

Do not add outline/ghost Card variants. If the grouping needs no surface,
it is a section with a heading, not a Card.

## Sizes

Size changes padding and gap, not type roles.

| Size | Padding / gap | Use |
| --- | --- | --- |
| `sm` | `--spacing-md` | Dense dashboards, nested grouping inside a larger region. |
| `md` (default) | `--spacing-lg` | Standard product Cards. |
| `lg` | `--spacing-xl` | Rare; a single featured group on an otherwise empty view. |

Media that bleeds to the edges still uses the size token for the remaining
sections, not for the image itself.

## States

Card is a container. It does not have hover/active/disabled of its own
unless the *entire Card* is a single destination or action — which is
usually the wrong pattern (put a Link or Button inside).

| State | Behavior |
| --- | --- |
| default | Static grouping. |
| hover | No chrome change for static Cards. If the whole Card is a Link (rare), use `--color-elevated-surface` on hover and a `--color-focus` ring on focus; the Card *is* the Link, not a Button. |
| focus | Focus lives on interactive children, not the Card. |
| active | N/A for static Cards. |
| disabled | Disable the controls inside; do not grey the whole Card unless every action is unavailable — and then explain why in the Content. |
| loading | Replace Content with [Skeleton](skeleton.md) shaped like the loaded layout, or set `aria-busy="true"` on the Card. Do not cover a Card with a disconnected [Spinner](spinner.md) if the structure is known. |
| error | Keep the Card; put an [Alert](alert.md) in Content (or replace Content with the Alert). Do not turn the Card border `--color-danger` as the only error cue. |

## Accessibility

- The Card root is a generic grouping (`<section>` or `<article>` when it is
  a self-contained unit; `<div>` when it is only visual). Do not set
  `role="group"` unless the Card is a true composite widget with its own
  name.
- If the Card has a Title, point the grouping at it:
  `aria-labelledby` on the section.
- Interactive children keep their own roles (Button, Link, IconButton).
  Do not make the Card clickable *and* nest Buttons — nested interactive
  elements.
- Keyboard: no Card-level keymap. Tab moves through the children.

### Keyboard

| Key | Action |
| --- | --- |
| `Tab` / `Shift+Tab` | Move between interactive children. |

## When to use

- A bounded cluster of related content that should read as one unit against
  the canvas.
- A form or setting group that is one task.
- A summary tile that still contains structure (title, meta, actions) —
  not a single status word.

## When NOT to use

- **Status labels** ("Beta", "live"). Use [Badge](badge.md).
- **Warnings and errors about the page or a section.** Use [Alert](alert.md).
  An Alert may sit *inside* a Card; it is not a Card variant.
- **Every block on the page.** If removing the surface, border, and radius
  does not hurt understanding, it should not be a Card.
- **Application chrome.** Header, Sidebar, PageHeader, and tables are their
  own components. A data table does not sit in a Card unless the table is a
  small embedded summary.
- **Clickable marketing tiles with overlay badges.** Product Cards contain
  controls; they are not posters.

## Radix/shadcn mapping

No Radix Card primitive. Structure follows shadcn
[Card](https://ui.shadcn.com/docs/components/card):

| Kiso | shadcn |
| --- | --- |
| Card | `Card` |
| Header | `CardHeader` |
| Title | `CardTitle` |
| Description | `CardDescription` |
| Action | `CardAction` |
| Content | `CardContent` |
| Footer | `CardFooter` |
| `sm` / `md` | `size="sm"` / default; map padding to `--spacing-md` / `--spacing-lg`, not raw values |
| `plain` / `elevated` | Default shadcn Card uses its `bg-card` token — restyle to `--color-surface` or `--color-elevated-surface` |

Ignore shadcn's invitation to hard-code spacing utilities. Card spacing
consumes `--spacing-md`, `--spacing-lg`, or `--spacing-xl` only.
