---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Give console screens one geometry from the packages. Inside `.page` the
PageHeader is at least `--size-control-sm` tall, so the title and the first
block do not move between pages with and without an action. A Form in a Card
takes the Card's radius, and an EmptyState alone in CardContent fills the Card
edge to edge. `data-width` (`left`, `center`, `right`, `full`) on a direct
child of `.page` places it: at most 720px for `.form-page`, 880px for any
other block, and the page width for `full`. The PageHeader joins the same box.
The shell layout's sidebar header gets an accent fill and a 2px primary
stripe, the brand inset now centres a 32px mark, navigation icons keep their
place on collapse, a rule separates navigation groups, and the phone Header
shows `brandMark` alone. kiso-react adds `ListPage` and `FormPage`. Both take
`width`: `full` by default for a list, `left` for a form.

kiso-react adds `ConsoleShell`: the shell layout with a collapsible sidebar,
the toggle in the Header, a breadcrumb that keeps its last item below 700px,
and an account Popover with the identity, an optional Account link, the
ThemeSelector, an optional language control and Sign out. It renders the one
`.page`. kiso-react also adds `DetailPage`: a PageHeader with one optional
action and a `.detail-tabs` card whose tabs take content or an empty state.
It takes the same `width` as `ListPage`. In `ui.css`, a detail tab whose only
child is an EmptyState or a table frame reaches the card's edges.
