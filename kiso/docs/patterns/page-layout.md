# Page layout

How wide a page is and where it sits on the screen. Three layers each own one
width: the shell, the page and the content.

## Purpose

Use the whole screen by default, and let a product choose a narrower,
placed page without its own CSS. Grids, tables and forms inside the page
follow the page and need no width of their own.

## The three layers

| Layer | Element | Owns |
| --- | --- | --- |
| Shell | [AppShell](../components/app-shell.md) | The main column: the screen less the sidebar and the inset frame |
| Page | `.page` | How much of the main column the page takes, and where it sits |
| Content | [DashboardGrid](../components/dashboard-grid.md), [Table](../components/table.md), `.form-page`, `.report` | Its share of the page, or its own measure |

Wrap each screen in one `.page`, beside the optional Header. The page owns the
padding around the content and the gap between its blocks.

```tsx
<ApplicationShell …>
  <div className="page">
    <PageHeader>…</PageHeader>
    <DashboardGrid aria-label="Overview">…</DashboardGrid>
  </div>
</ApplicationShell>
```

## Page width and alignment

| Attribute | Values | Default |
| --- | --- | --- |
| `data-page-width` | `full`, `contained` | `full` |
| `data-page-align` | `start`, `center`, `end` | `start` |

- `full` takes the whole main column, at every screen width.
- `contained` stops the content at `--size-content-max` (1280px). The page
  box still takes the whole column, so its background and scroll bar reach
  the edge of the screen. On a narrower main column the content takes the
  column, as with `full`.
- `data-page-align` places a contained page in the free space: `start` (left
  in a left-to-right page), `center` or `end`. It has no effect on a full
  page.

Choose once for the product on `html`:

```html
<html lang="en" data-page-width="contained" data-page-align="center">
```

Set an attribute on a region or on one `.page` to override the product's
choice there. Keep one choice per product, so pages do not jump when the
reader moves between them.

## Terminal

In a terminal, `tui-kiso` `AppShell` has the same two choices, and the same
defaults.

| Web | Terminal |
| --- | --- |
| `data-page-width="full"` | `.page_width(PageWidth::Full)`: the page takes the column beside the sidebar. `Grid` gives it every track that fits. |
| `data-page-width="contained"` | `.page_width(PageWidth::Contained)`: the page stops at 88 columns, six grid tracks. |
| `data-page-align` | `.page_align(PageAlign::Start)`, `Center` or `End`. It has no effect on a full page, or on a column of 88 or fewer. |

The `page` area of `AppShell::areas` is the placed page. When the app takes
columns from the page column first, as for a panel beside the page, it
calls `AppShell::place` on what is left. Choose once for the product. See
[terminal interfaces](../terminal-interfaces.md).

## Content inside the page

`.page` is a single-column grid. Every direct child takes the page width,
except content with its own measure:

| Content | Width |
| --- | --- |
| PageHeader, Table, Card, Alert | The page width |
| [DashboardGrid](../components/dashboard-grid.md), [PaneGrid](../components/pane-grid.md) | Twelve columns of the page width. A pane's `size` is its share |
| `.form-page` | At most 720px, at the start of the page |
| `.report` | The printed sheet, 186mm. See [Report](report.md#page-and-width) |

Content with its own measure sits at the start of the page. To center a
screen, center the page with `data-page-align`; the content moves with it.
Kiso has no rule to center one block inside a full page.

For side-by-side regions, use a grid component instead of product CSS:
DashboardGrid for metric panels, PaneGrid for the summary panes of one
object, [Split](../components/split.md) for two panes of one workspace.

## Responsive behavior

Below 1024px the sidebar leaves the shell and the main column takes the
screen. A contained page is then narrower than 1280px and takes the whole
column, so alignment has no visible effect. Grids reflow to fewer columns as
their own contracts describe.

## Do not

- Do not set `max-width` or `margin` on `.page` in a product. Use the
  attributes.
- Do not wrap the page in another container to center it.
- Do not give a grid or table a fixed width to make it narrower. Contain the
  page instead.
