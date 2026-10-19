---
"@momoi-labs/kiso-react": minor
"@momoi-labs/kiso": minor
---

DashboardGrid is now a PaneGrid, so readers can move and resize dashboard
panels. DashboardPanel is a GridPane and needs an `id` and a `title`. Its
`size` replaces `span`, and the panel is the Card, so put the widget in it
directly. DashboardGrid takes PaneGrid's `layout`, `defaultLayout` and
`onLayoutChange`, so the product can save the layout. The `.dashboard-grid`
and `.dashboard-panel` CSS no longer sets columns. A Chart inside a pane
hides its caption visually, since the pane title names it.
