---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Add PaneGrid and GridPane. A PaneGrid lays an object's summary panes out on
twelve columns in rows. The reader resizes a pane at its end edge, up to the
free columns of its line, and moves it by its title, into a row or onto a
row of its own. Sizes never change on a move. A row wider than twelve columns
wraps onto more lines, or scrolls with `overflow="scroll"`. `fill` spends a
line's free columns on screen and `pack` orders a row by size. The grid
reports every change through `onLayoutChange` for the product to persist,
scales to six columns below 1024px and stacks below 640px.
