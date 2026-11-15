# Shell layout

Where the brand, the header and the sidebar sit on desktop, from 1024px. This
page adds placement rules to the [application shell](application-shell.md).
Below 1024px every page shows the brand in the Header and opens the
navigation in a drawer, as [AppShell](../components/app-shell.md#phone-navigation)
describes.

The gallery shell in
[`blocks/react-prototype/src/gallery.tsx`](../../blocks/react-prototype/src/gallery.tsx)
and `gallery.css` is the reference implementation.

## Home and section pages

| Page | Sidebar |
| --- | --- |
| Home: the product's landing | None. Main takes the whole width. |
| Section: any page inside a group of destinations | The Sidebar lists the destinations of the active Header tab. |

- All section pages share one open state. It starts open.
- Closing the sidebar turns it into the icon rail (`collapsed`). It does not
  hide it.

## Brand placement

Choose by `headerVariant`:

| Header variant | Brand | Sidebar |
| --- | --- | --- |
| `floating` | Inside a floating Header that spans the screen, on every page. | Starts below that Header. The rail has no mark. |
| `default`, `plain` | Section pages: in the sidebar header. Home: at the start of the Header. | The rail keeps the mark. The mark expands the sidebar. |

The brand starts at the brand inset: `(--size-touch-min + 2 *
--spacing-md - --size-control-xs) / 2` from the sidebar edge. The open
sidebar, the rail and the home Header all use it.

## Home bar on an inset shell

With `appShell="inset"` and a `default` or `plain` Header, the home Header
sits on the outer surface across the whole screen, outside the inset card.

- `data-page-width="full"`: the brand sits at the brand inset, at the same
  place as on section pages.
- `data-page-width="contained"`: the Header background still spans the
  screen. Its row (brand, tabs, actions) follows the content column and
  `data-page-align`, with the brand at the start of the column.

CSS cannot read where a contained column sits, so measure it in script. Set
the gap between the Header edges and the column as the Header's inline
padding, and measure again on resize and when the page attributes change.

## Floating Header

- Start padding is at least the corner radius: `max(brand inset, radius)`.
  End padding is `max(--spacing-md, radius)`. Content stays clear of the
  curve.
- Tabs sit `--spacing-sm` inside the bar, with a radius of `radius -
  --spacing-sm`, so they follow the curve. The active tab has no shadow.
- The Header has `z-index: 25`, above the main content and the inset card.
  Content scrolls under it.
- The sidebar and the settings panel start below the bar: bar height plus
  `2 * --spacing-md`.
- The bar row is one surface across the full width. A background canvas
  stays behind main on section pages. On the home page, with no sidebar, it
  runs behind the bar too.

## Invariants

- The brand does not move when the sidebar opens or closes.
- With a full page, the brand does not move between home and section pages.
- The Header and the sidebar header share one height. Set one bar height
  with `box-sizing: border-box` and no block padding on both. In an inset
  shell both add the frame offset.
- No page scrolls sideways at 390px.
