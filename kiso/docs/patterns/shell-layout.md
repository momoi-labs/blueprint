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
--spacing-md - 1px - --size-control-sm) / 2` from the sidebar edge. It
centres a `--size-control-sm` mark in the rail, inside the rail's 1px border.
The open sidebar, the rail and the home Header all use it.

The sidebar header has a `--color-accent-surface` fill and a 3px
`--color-primary` stripe (`--app-shell-brand-stripe`) drawn as an inset
shadow on its bottom edge. A floating Header has neither. Navigation icons
start under the centre of the mark, open or collapsed. Below 1024px the
Header shows the mark alone.

ApplicationShell applies this with `shellLayout` and `brandMark`. The CSS
exposes `--app-shell-brand-inset` and `--app-shell-bar-height` on
`.app-shell`. See [App shell](../components/app-shell.md#shell-layout).

For a console, `ConsoleShell` in kiso-react sets `shellLayout`, a collapsible
sidebar with the toggle in the Header, and the default Header. It fills the
Header with the breadcrumb and the account Popover, and wraps the screen in
the one `.page`. See [App shell](../components/app-shell.md#console-shell).

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

## Settings panel open

From 1024px the settings panel docks as a column at the end of the shell.
Below 1024px it opens as an overlay and the grid does not change.

- The Header keeps the layout of its page type and stays one row. A
  floating Header still spans the screen. Brand, tabs, version, search and
  the gear stay inside the bar.
- Place the panel in the last grid column (`grid-column: -2`). Do not leave
  it to auto-placement: a background canvas that covers every cell pushes it
  into an extra implicit column, and main and the bar shrink to the first
  tracks.
- The panel follows the sidebar's top rule: below the bar when the bar spans
  its column, at the top of the frame when the bar sits beside it.

## Invariants

- The brand does not move when the sidebar opens or closes.
- With a full page, the brand does not move between home and section pages.
- The Header and the sidebar header share one height. Set one bar height
  with `box-sizing: border-box` and no block padding on both. In an inset
  shell both add the frame offset.
- No page scrolls sideways at 390px.
