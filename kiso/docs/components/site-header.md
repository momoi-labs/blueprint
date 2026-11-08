# SiteHeader

## Purpose

SiteHeader is a site's top bar: the brand, a few links and one or two actions,
such as Install or a language menu. It can stick to the top and follow the
band under it.

## Anatomy

```
SiteHeader (sticky, overlay)
├── brand
├── toggle: menu Button, below 760px
└── nav
    ├── links: a list of anchors
    └── actions
```

```tsx
<SiteHeader sticky brand={<a href="/">pg-probe</a>}
  links={[<a href="#how">How it works</a>, <a href="#mcp">MCP <Badge variant="warning">New</Badge></a>]}
  actions={<Button variant="primary" size="sm">Install</Button>} />
```

| Prop | Default | Behavior |
| --- | --- | --- |
| `brand` | none | The product mark and name, usually a link home. |
| `links` | none | Anchors. Each one becomes a list item. Mark the current page with `aria-current="page"`. |
| `actions` | none | Buttons or a DropdownMenu after the links. |
| `sticky` | `false` | Keeps the bar at the top of the page, with a solid surface and a bottom border. It takes the tone of the [SiteSection](site-section.md) under it while the page scrolls. |
| `overlay` | `false` | Lays the bar over the next SiteSection, transparent, and makes it sticky. The bar turns solid when that section scrolls away. The section adds the bar's height to its top. |
| `fold` | `menu` | Below 760px. `menu` folds links and actions behind the toggle. `hide` hides the links and keeps the actions in the bar, without a toggle: for a site whose sections are all on one page. |
| `labels` | English | `navigation`, `open` and `close`: the nav name and the toggle's names. |

Placed in a [SiteSectionHead](site-section.md), the bar belongs to that
section and scrolls away with it.

## Variants

No visual variants. Tone comes from the band: the bar's own tone when it is
inside a section, the tone of the band under it when it is sticky.

## Sizes

The bar is `--size-control-md` high plus `--spacing-md` above and below. Links
use `--type-size-label` and `--color-muted-foreground`; the current link and
the hovered one use `--color-foreground`. The inner column matches
SiteSection's, so the brand lines up with the section content.

## States

| State | Behavior |
| --- | --- |
| Transparent | `overlay`, while the next section is under the bar. |
| Solid | `--color-background` with a `--color-border` line below. |
| Folded | Below 760px of bar width, links and actions hide behind the toggle. With `fold="hide"`, only the links hide. |
| Open | The menu drops below the bar in the bar's tone. A link, Escape or a press outside closes it. Escape returns focus to the toggle. |

## Accessibility

The root is a `header`. Links sit in a `nav` named by `labels.navigation`, as
a list. The toggle is a Button with `aria-expanded` and `aria-controls`, named
"Open menu" or "Close menu". A Badge inside a link is read as part of the
link's name. Focus order is brand, toggle, links, actions.

### Keyboard

| Key | Action |
| --- | --- |
| Tab | Moves through brand, toggle, links and actions. |
| Enter, Space | On the toggle, opens or closes the menu. |
| Escape | Closes the open menu and returns focus to the toggle. |

## When to use

- The top bar of a site page built from SiteSections.

## When NOT to use

- An application. Use [Header](header.md) in [ApplicationShell](app-shell.md).
- More than six links or nested menus. A site bar points to a few
  destinations; put the rest in the footer.

## Radix/shadcn mapping

No Radix or shadcn primitive. The toggle is Kiso's [Button](button.md); a
language menu is a [DropdownMenu](dropdown-menu.md) in `actions`.
