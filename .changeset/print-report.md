---
"@momoi-labs/kiso-react": minor
"@momoi-labs/kiso": minor
---

Kiso pages print. On paper they use the light scheme, hide the shell,
navigation, actions and interactive chart parts, lay grids out as blocks so
Chrome paginates them, stop tables and pane bodies from scrolling, open closed
Disclosures and drop pane frames.

A new Report pattern sets a sheet-wide `.report` page with A4 margins, a page
number footer, one page per section, document section headings and a
`.report-kicker` for the cover. PaneGrid and DashboardGrid take `static` for
one column with nothing to move or resize. In a report, a Chart's caption
hides in a pane wherever the chart sits.

On paper a table grows to hold all its rows, with its footer after them, even
when the product bounds its height. Headings, numbers and tight columns wrap
so a wide table fits the sheet.
