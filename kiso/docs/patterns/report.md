# Report

A document that a person reads in order and prints: a cover, then sections
that each start a page. It reuses the panels, charts and tables of the
product's screens, laid out for paper.

## Purpose

Hand the findings of a screen to someone who will not open the product: a
customer, an auditor, a meeting. A report does not filter, sort or drill
down. Everything it shows is on the page when the person prints it.

## Component composition

| Region | Compose with | Role |
| --- | --- | --- |
| Cover | [PageHeader](../components/page-header.md) with a `.report-kicker` and a short intro paragraph | What the document is, what it covers, when it was made |
| Report body | `.report` | Sheet-wide column; sets the printed page |
| Section | `section` with an `h2`, or an open [Disclosure](../components/disclosure.md) that a screen shares | One topic. Starts a page |
| Panels | [DashboardGrid](../components/dashboard-grid.md) with `static` | One column in layout order |
| Content | [Chart](../components/chart.md), [Stat](../components/stat.md), [Meter](../components/meter.md), [Table](../components/table.md), [Alert](../components/alert.md) | The findings |
| Print action | [Button](../components/button.md) in the PageHeader actions | Calls `window.print()`. Hidden on paper |

```tsx
<div className="page">
  <PageHeader actions={<Button onClick={() => window.print()}>Print report</Button>}>
    <p className="report-kicker">PostgreSQL health report</p>
    <PageHeaderTitle>pgsql01</PageHeaderTitle>
    <PageHeaderDescription>Captured 19 October 2026 · 180 samples</PageHeaderDescription>
  </PageHeader>
  <div className="report">
    <p>Charts cover the whole session.</p>
    <section aria-labelledby="system">
      <h2 id="system">System</h2>
      <DashboardGrid aria-label="System" static>
        <DashboardPanel id="cpu" title="CPU by state (%)">
          <Chart label="CPU by state (%)" … />
        </DashboardPanel>
      </DashboardGrid>
    </section>
  </div>
</div>
```

## Page and width

`.report` is as wide as the printed sheet, on screen too: A4 less 12mm
margins, 186mm. A [Chart](../components/chart.md) measures its width when it
draws and does not redraw for print, so it must already be as wide as it
prints. On a screen narrower than the sheet the report takes the screen
width, and its charts print narrower than the page.

On paper the report uses the named page `report`: A4, 12mm margins, and
"Page n of m" in the bottom right corner in `--type-size-metadata` and
`--color-muted-foreground`. The page applies to the whole document whenever a
`.report` is on it. A product that needs another paper size or a localized
footer adds its own `@page report` rule after Kiso's.

## Structure

- **Cover.** Everything before the first section: the PageHeader and the
  intro. The `.report-kicker` paragraph names the kind of document above the
  title, in caps metadata style.
- **Sections.** A direct child of `.report` that is a `section` or a
  Disclosure. Each one starts a page. Its heading, the `h2` or the summary,
  has the page-title size with a 2px `--color-primary` rule above it, and
  reads as a document heading.
- **Panels.** Pass `static` to DashboardGrid. Panels stack in one column at
  full width, in layout order, and have nothing to move or resize. A panel
  avoids a page break inside it; a panel taller than a page still splits.

A section that a screen also shows may stay a Disclosure. Pass `open`: in a
report the summary has no marker, so a closed section would look empty.
Prefer `section` and `h2` when nothing is shared, since a summary is not a
heading for assistive technology.

## Print

Kiso's print rules apply to every page that loads `ui.css`:

- The light scheme, whatever the theme, and exact colors.
- No topbar, sidebar, side panel, bottom navigation, canvas pattern or shell
  frame. No PageHeader actions and no buttons in pane heads.
- Block layout with margins from `.page` down to a pane's content. Chrome
  does not grow a grid row when it moves content to the next page, so the
  content after the row overlaps it.
- Nothing scrolls: pane bodies, `.table-scroll` and `.chart-table-scroll`
  show all their content, table cells wrap, and the scroll fade is off.
  Chrome does not split a scrolling box across pages.
- A pane drops its card frame. Its title sits on its content like a heading
  on its text: no head padding or border, `--spacing-xs` above the body and
  `--spacing-sm` between its blocks.
- A Chart hides its exact values Disclosure, its synchronized marker and its
  pinned readout.
- A Disclosure prints its content even when it is closed, in browsers that
  support `::details-content`, and its summary has no marker. In other
  browsers pass `open` to print the content.

## States

| State | Behavior |
| --- | --- |
| loading | Do not print until every panel has its data and its charts have drawn. A product that prints on load waits for its queries, then calls `window.print()`. |
| empty section | Keep the heading and say what is missing in a sentence. Do not print a blank page. |
| unavailable source | Name it on the cover, once, rather than in an empty panel per page. |

## Accessibility

The report keeps the heading order of a document: the cover title is the
`h1`, section headings are `h2`, pane titles are `h3`. A static pane head is
a plain heading with no button role. Links keep their text on paper; write
link text that makes sense without the URL.
