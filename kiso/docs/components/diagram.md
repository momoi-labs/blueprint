# Diagram

## Purpose

Diagram shows how the parts of a deployment connect: the routes that reach a
service, the image or repository that runs it, the database and cache behind
it. It is read left to right, one column per stage, top to bottom, one row
per stage, or on a grid where links run right and down at once, and it is a
drawing, not a list. On a narrower panel node text wraps to fit; when even the wrapped
drawing does not fit, the drawing keeps its natural width and scrolls.

## Anatomy

```
Diagram (.card.diagram, optional data-background-style and data-background-strength)
└── scroll region (.diagram-scroll, role="group", tabindex="0")
    └── canvas (.diagram-canvas): paints the background pattern
        ├── lanes (.diagram-lanes, data-direction): one DiagramColumn or DiagramRow per stage,
        │   or a DiagramGroup that holds stages of its own; in a grid, bands
        │   (a DiagramGroup or a DiagramRow) of DiagramColumn cells
        │   ├── DiagramNode (.card.diagram-node, data-kind, data-tone, data-status)
        │   │   ├── kind row: icon + caption (.t-caps, optional)
        │   │   ├── title (.diagram-node-title, optional): led by the icon when there is no caption
        │   │   ├── free text (.diagram-node-text, .mono, optional)
        │   │   ├── StatusBadge (optional)
        │   │   └── parts (optional): DiagramFact rows, DiagramFold
        │   ├── DiagramNodeGroup (.card.diagram-node-group): several nodes drawn as one card
        │   └── DiagramGroup (.diagram-group, role="group", data-line, data-tone, data-open): a frame around nodes or groups
        │       ├── title (.diagram-group-title): caption · name, on the top border;
        │       │   a button (.diagram-group-toggle) with a chevron when collapsible
        │       ├── body (.diagram-group-body): its nodes
        │       └── footer (.diagram-group-foot, optional)
        └── edges (svg.diagram-edges): one path per source (data-shape when not
            orthogonal), its head (marker.diagram-arrow, data-arrow), junction
            dots, plates (.diagram-edge-plate), knockouts (.diagram-edge-knock)
            and labels
└── footer (.diagram-footer, optional): under a rule, such as the key of the series edges

DiagramEdgeKey (.diagram-edge-key): a still sample of a series edge and its meaning

DiagramFold (.diagram-fold): a header that folds the rest of the node
├── head (button.diagram-fold-head): title, count Badge, chevron
└── body (.diagram-fold-body)
    ├── DiagramFilter (.diagram-filter, optional): chips that show one section
    └── DiagramSection (.diagram-section): heading with icon, count and action
        └── DiagramLine (.diagram-line): a name, and an end on the right
```

```
┌ ROUTE ──────────────────┐
│ honcho.momoi.internal   │──┐  :8000  ┌ GIT REPOSITORY ┐  DATABASE_URL  ┌ DATABASE ─┐
└─────────────────────────┘  ├────────▶│ honcho         │───────────────▶│ honcho-db │
┌ ROUTE ──────────────────┐  │         └────────────────┘                └───────────┘
│ tools.momoi.internal/h… │──┘
└─────────────────────────┘
```

A node is a Card. It takes the theme's frame, corner marks and corners, so a
diagram built with Pixel corners and ticks looks like the rest of that
product. Each kind has a tone: `neutral` for a route, `primary` for a
service, repository or image, `info` for a database. The icon takes that
tone; the caption stays muted.

### Frame

Nodes follow the appearance of the panels around them. To draw them
differently, the Diagram takes the same choices as the
[appearance attributes](../tokens.md#appearance-attributes): `borderStyle`
(`solid`, `none`, `rail`, `dash`, `bevel`, `double`, `base`, `offset`,
`manga`, `brush`), `cornerStyle` (`square`, `rounded`, `asym`, `pixel`),
`cornerSize` (`off`, `small`, `medium`, `large`) and `cornerMarks` (`none`,
`ticks`, `brackets`, `arcs`, `diagonal`, `dots`). They open a nested
appearance scope on the lanes, so they reach every node and leave the
diagram's own panel to the page. A node takes the same four props to
override the Diagram, which is how one node that is down gets a dashed
frame while the rest stay solid. Unset means inherit, at both levels. The
pairing rules of the appearance settings hold here too: a border style that
does not pair with Pixel corners (`rail`, `dash`, `bevel`, `double`, `base`,
`offset`) drops the Pixel contour for that scope, and curved brackets do not
draw on Pixel, Manga or Brush.

Edges leave the right edge of each source, turn in the channel before the
next column with an 8px radius, and enter the left edge of the target with
one filled arrowhead. Several sources in one `DiagramEdge` join in the
channel and come in at one point. Several `DiagramEdge`s into the same
target each get their own entry point, spread down the target's side in the
order of their sources, so their arrowheads and labels never land on the
same spot. An edge label sits on its run in mono, with a stroke in the card
colour knocking the line out behind it. Edges are measured from the rendered
nodes, so they follow font loading, wrapping, folding and resizing.

All three layouts route edges the same way, described under
[Grid](#grid): left to right is top to bottom with the axes swapped. In
left to right and top to bottom, an edge to the next stage turns in the
channel between the stages; an edge that would cross a node on the way runs
straight past it instead, as a drop.

Two nodes in the same stage are joined across the gap between them: the
bottom of the upper node to the top of the lower one in a column, side by
side in a row. The label sits beside or above that run.

An edge's `line` is `solid` by default; `dashed` or `dotted` says the link
is not serving. Its `tone` is `neutral` by default; `success` or `danger`
colours the line and its arrowhead with the matching status colour, the same
three readings as [StatusBadge](status-badge.md). A dotted danger edge into
a failed node is how a dependency that is down reads at a glance. Left to
right and top to bottom, the plain edges out of one source share one trunk.
When their lines or tones differ, the trunk stays solid and neutral up to
where they part, and each branch past it says how its own link is doing.

### Top to bottom

`direction="down"` reads the drawing top to bottom, one `DiagramRow` per
stage, nodes side by side. Edges leave the bottom of each source, run down to
a channel between the source and the target, turn with the same 8px radius,
run across and enter the top of the target. The channel sits midway, or in
the widest gap left when a node or a group that holds neither end is in the
way. Exits spread along the source's
bottom in the order of their targets, and entries along the target's top in
the order of their sources, so no two land on the same spot. When the runs
of two edges overlap in one channel, each gets its own track, 6px apart, so
their dashes never paint over each other. A label sits beside the edge's run
into the target.

A label goes on the edge's run into the target; see [Labels](#labels).

Edges go to the same row or a row further down. An edge to a row above is
not drawn. One that skips a row runs straight down past the nodes between,
when their stage leaves room beside them; a shape that needs more is a
graph, not a Diagram, or a grid.

Rows share the width of the widest one. `justify` on a row places its nodes
across that width: `center` (default), `start`, `end` or `between`. That is
how a node sits under the one it hangs from, without a layout engine.

### Groups in every layout

A `DiagramGroup` frames stages as well as nodes, so groups such as sites
do not depend on the layout. Left to right, a group at the top level holds
`DiagramColumn`s side by side; top to bottom, it holds `DiagramRow`s one
under another. The stages inside keep the gap of the stages around them. A
group inside a stage holds its nodes: stacked in a column, side by side in a
row. In a grid, a group is a band; see [Grid](#grid).

### Grid

`direction="grid"` is for a drawing with two axes, such as a database
cluster: replication runs right, to the standby clusters, and data at rest
runs down, to storage. `columns` sets the number of shared columns. Each
child of the Diagram is a band that spans them all: a `DiagramGroup` such
as a site, or a plain `DiagramRow` for a band with no frame. Inside a band each `DiagramColumn` is one cell, its nodes top to
bottom, `--spacing-4xl` apart. The bands share the columns through CSS
subgrid, so a node in one band lines up under the node above it in the band
before. A group inside a cell holds its nodes side by side.

Each edge picks its route from where its nodes are:

| Route | When | Path |
| --- | --- | --- |
| side | the target is beside the source, their heights overlap | straight across, or an elbow when they do not face |
| down | the target is below, the two overlap across | out the bottom, a turn at a lane midway, into the top |
| drop | the target is below, they do not overlap across | out the bottom, down, into the target's near side |

A side edge steps only when it must. It runs level at the height nearest
its spread entry that both nodes share and that keeps 12px clear of the
other edges on the sides it uses, those coming into the target's side and
those coming into the source's side it leaves by. Only when no such height
exists does it take an elbow.

`route` on a `DiagramEdge` forces one of the three when the pick is wrong.
An edge to a node above its source is not drawn, and says so in the console.
Left to right the same names hold with the axes swapped: down means toward
the right, and side means up or down the column.

The routes keep crossings to a minimum. Exits spread along the bottom of a
source in the order of their targets, left to right, and each keeps clear of
every node its straight run passes, so a trunk never runs through a node.
A trunk that runs past its target and turns into its side stays 24px from
that side, the turn included, so the run into the node is long enough to
read as an arrow.
Entries spread along the side they use: on the top in the order of their
exits, on a side with edges from above first, the nearest on top, then edges
from beside. Runs that overlap in one lane get their own tracks. Kiso does
not route around nodes: a run that still passes through one is reported
once in the console, and the fix is to move the node or set `route`.

### Shared trunks

Two or more edges down from one source with one series share a trunk: one
exit and one straight line. In a grid, the edge to the farthest target keeps
that line to its end, and each nearer edge leaves the trunk at a dot, 3px in
the edge's colour, curves away with the 8px radius and goes on to its own
target. A label on the far edge sits on its long run, below the split, never
on the stub above it. Top to bottom, the trunk runs down to the channel and
the branches part along it; the dot sits where the nearest branch turns
down, or at the fork when they part both ways. The trunk carries the series
dash and flow; the dot stays still.

### Edge shapes

`edges` on the Diagram sets how every edge is drawn, and `shape` on a
`DiagramEdge` overrides it for that edge. Routing does not change: each edge
keeps its exit, its entry, its trunk and its dot. The shape only changes the
line between them.

| `edges` | Line |
| --- | --- |
| `orthogonal` (default) | runs and elbows with an 8px radius |
| `curve` | one smooth curve, as in a node editor |
| `straight` | one straight segment |
| `sketch` | the orthogonal line, drawn by hand |

- **Shared runs stay orthogonal.** The part of an edge that lies on another
  edge, a trunk up to its dot or the stub that leaves it, keeps its right
  angles, so the dot stays on every line through it. The shape starts where
  the edge parts from the others.
- **`curve`** leaves along the run it parts from and comes in along its
  entry, then runs straight for its last 12px, so the arrowhead points along
  the line. Each handle is the larger of 60% of the distance along its own
  axis and 30% of the span, from 32px to 160px, so short links still arch.
- **`straight`** goes direct. When it would come into a node's side at a
  steep angle, steeper than 1.5 to 1, it comes in through the top or bottom
  instead, 20px clear of the corners, with a straight 12px run. A straight
  line takes no detour, so it can cross a node in between; Diagram reports
  it once in the console, as it does for any run through a node.
- **`sketch`** wobbles about 1.4px across the line. The wobble depends only
  on where a point is, so it is the same on every render, and two edges on
  one stem wobble alike. It fades out near ends, corners, dots and crossing
  marks, so heads, dots and hops sit on the line. It pairs with the Manga
  and Brush frames.

Series dashes, flow and reduced motion work the same on every shape.

```tsx
<Diagram direction="grid" columns={2} edges="curve" arrow="chevron" label="Varejo Prod: replication and storage">
  {/* ...groups and nodes... */}
  <DiagramEdge from="db1" to="db2" series={1} flow />
  <DiagramEdge from="db1" to="s3" series={3} shape="orthogonal" arrow="triangle" />
</Diagram>
```

### Arrowheads

`arrow` on the Diagram picks the head every edge ends in, and `arrow` on a
`DiagramEdge` overrides it. Unset is `triangle`, or `sketch` on a sketched
edge. Every head has the edge's colour and the same size and tip as the
triangle.

| `arrow` | Head |
| --- | --- |
| `triangle` | a filled triangle |
| `chevron` | an open chevron |
| `stealth` | a notched, filled head |
| `dot` | a filled dot at the end |
| `sketch` | two uneven strokes, drawn by hand |
| `none` | no head; the line ends with its round cap |

A dot or no head drops the sign of direction. Use them where the direction
is clear from the drawing or does not matter.

### Crossings

`crossings` says how an edge draws where it crosses a frame or another edge.
A crossing is a vertical run over a horizontal line, which is another edge's
horizontal run or a group's top or bottom border, or a horizontal run over
a group's side.

| `crossings` | Drawing |
| --- | --- |
| `none` (default) | the lines cross |
| `hop` | the crossing edge jumps the line in a 5px half circle |
| `gap` | the crossing edge stays straight and the crossed line breaks, 4px on each side |

A gap in a frame is a plate in the card colour under the edge; a gap in an
edge leaves that stretch of its path out. Neither draws within reach of an
elbow, an edge's start or a frame's rounded corner, and of two crossings
closer than 12px on one run only the first draws. After a mark, the line
runs at least 12px to its end, arrowhead included, so the arrow sits on a
straight line; when there is no room for that, the mark is left out rather
than squeezed. A group's 24px entry room leaves enough for it. It applies to
every direction.

A curve or a straight line has no runs, so its crossings are found on the
drawn line, and they are always gaps: a hop on a slanted line reads as a
bump. The later edge crosses the earlier one and a short stroke in the card
colour under it, the knockout, breaks the earlier line. The same holds when
an orthogonal edge crosses a curve. A crossed frame gets a plate as wide as
the slanted line needs. A sketched edge hops and gaps as an orthogonal one.

### Labels

`labels` sets how edge labels read, in every direction:

- **`auto`** (default). A label on a vertical run turns -90 to read along
  it, centred on the line, on a plate in the card colour that breaks the
  line; a halo alone would let the line show through at a space. It sits in
  the middle of the run, clear of its corners, arrowhead, crossings and any
  split above it. A run too short to hold it gets the label beside the line
  instead. A label on a horizontal run sits above it.
- **`horizontal`**. Every label stays flat. On a vertical run it sits on the
  line, on a plate, at the same spot a turned label would take. Labels on
  vertical runs closer than their width apart overlap, so prefer `auto` when
  runs sit close.
- **`vertical`**. A label on a vertical run always turns, even when it is
  longer than the run.

On a curve or a straight line there is no run to turn a label along, so it
sits flat, centred on the line, on a plate, in the middle of the edge's own
part, past any shared stretch. `labels` does not change it. A curve that is
one straight run along an axis keeps the rules above.

A flat label between two nodes that does not fit the gap, less the
arrowhead, breaks at its first space into two lines, both above the arrow:
"Lag:" over "0 B". A single word that does not fit stays on one line. A
flat run that crosses group sides, such as an edge out of one group
into another, takes its label in the widest stretch between borders, the
gap between the two frames, so the label never sits across a border.

### Groups

`DiagramGroup` draws a frame around one or more nodes, each still its own
card, or around other groups: a cluster and its members, a network and its
hosts, a site and its clusters. Groups nest, and every group carries its own
name on the border. A group has a `line`, `dashed` (default), `solid` or
`dotted`, and a `tone` for its colour, `neutral` (default, in
`--color-border-strong`), `primary`, `info`, `success`, `warning` or
`danger`. Line and tone are the product's choice to tell kinds of group
apart, such as solid sites holding dashed clusters; a tone is not a status
unless the product says so in the title or footer. A group that holds groups
has more room inside, `--spacing-lg`, since it holds frames, not cards.

`collapsible` makes the title a button that folds the group, open by
default (`defaultOpen`). Folded, the frame keeps the width it had open and
gives up its height, like a DiagramFold, so the drawing does not move
sideways. Left to right it keeps its height instead and gives up its
width, with its line of nodes in the middle, so the columns beside it do
not move up or down. Its body becomes one line of its nodes, each only its icon and
title, side by side; groups inside open into that line and drop their
frame, title and footer, and the group's own footer leaves. The nodes stay
mounted and keep their state. Edges to a folded node reach the outermost
folded frame around it instead, ending just under its title when they come
in from above; an edge between two nodes of one folded frame is not drawn,
and a source and target pair is drawn once per look.

A side where an edge comes in from outside the group keeps
`--spacing-xl` between the border and the node, so the line runs straight
again after it crosses the border and the arrow still reads. The Diagram
marks those sides with `data-entry` (`left`, `right`); the other sides keep
their padding. Its name sits on the top border, the `label` caption
in caps, a dot, and the `title` in weight: "CLUSTER · **main**". The name
knocks the line out with the card colour, as an edge label does, and sits
above the edges, so an edge into a node inside passes under it. An optional
`footer` sits under a rule in the group's line and colour that runs edge to
edge. Edges reach each node inside on its own. In a row its nodes sit side
by side; in a column they stack. A DiagramNodeGroup is one card split by
rules; a DiagramGroup is a frame around cards.

### Series edges

An edge's `tone` is a status. To tell kinds of link apart without one, such
as replication, WAL and backups, an edge takes a `series` instead of a
`line` and a `tone`. The series picks the [chart colour](../tokens.md#categorical-chart-colors)
of that slot and a dash of its own, so colour is never the only sign:

| Series | Dash |
| --- | --- |
| 1 | dash |
| 2 | dots |
| 3 | dash and dot |
| 4 | long dash |
| 5 | dash and two dots |

Slots past 5 take the chart's generated colours and reuse the dashes in
order, so each pair stays unique. A series edge is 2px wide and its
arrowhead takes its colour. `flow` moves the dash toward the target, at the
same speed for every dash; it stops under `prefers-reduced-motion`. Only a
series edge flows: a solid line has nothing to move.

A drawing with series edges needs a key. The product builds it from
`DiagramEdgeKey`, a still sample of the edge and what it means, and places
it in the Diagram's `footer`.

### Footer

`footer` places content inside the card, under a 1px `--color-border` rule:
usually the key of the series edges, built from `DiagramEdgeKey` items. The
items sit in one row on a wide card and one per line when the footer is
narrower than 36rem. The card is a grid with one `minmax(0, 1fr)` track, so
it never collapses to its content's minimum inside a narrow grid.

### Kinds

| `kind` | Caption | Icon | Tone |
| --- | --- | --- | --- |
| `route` | Route | Route | neutral |
| `service` | Service | Server | primary |
| `repository` | Git repository | GitBranch | primary |
| `image` | Container image | Container | primary |
| `database` | Database | Database | info |

`icon` and `label` override the kind's defaults. A node without a kind passes
its own `icon` and `label`; it reads as neutral. Icons are
[Lucide](https://lucide.dev) components, a peer dependency of the React
package, drawn through `.icon` at `--size-icon-sm` with a 1.75 stroke.

### Structured nodes

A node that holds more than a line or two of text is built from parts.
Text children still render as free text; element children render as they
are, after the status badge.

- **Lead line.** A node with an `icon` and no caption (no `kind`, no
  `label`) draws the icon muted in front of the title, on one line:
  `(globe) app.example.com`.
- **Optional title.** `title` is optional and takes any node. A node that
  only holds a fold, such as a Databases list, leaves it out.
- **DiagramFact.** One fact as a row: an icon and a name, muted, and the
  value in mono on the right. A value that does not fit wraps onto its own
  line, still right-aligned. `empty` is said, muted, when there is no value.
- **DiagramFold.** A header with a title, a count Badge and a chevron that
  folds the rest of the node. It is open by default (`defaultOpen`). Folded,
  the body keeps its width and gives up its height, so the node does not
  narrow and edges do not move sideways; hidden content leaves the tab order.
  A fold reaches the node's edges and sits under a rule.
- **DiagramFilter.** Chips that show one section at a time, the first one
  showing all of them with their total. It is controlled: the product keeps
  the value and renders the sections that match. Render it only when there is
  more than one kind.
- **DiagramSection.** A heading with an icon, a count and an `action`, such
  as an icon Button that adds one, then its lines hanging from the heading
  as a tree. Without a `title` the lines sit flat, with no tree.
- **DiagramLine.** A name in mono and an `end` on the right, such as a
  target, a state or a Badge. The end wraps under the name when it does not
  fit. With `onClick` the line is a button.

### Node groups

`DiagramNodeGroup` draws several nodes as one card, split by a rule: the
container that receives requests with the other containers folding under
it. Edges still reach each node on its own, so the arrow ends on the node
that receives requests, not the middle of the card. Top to bottom and in a
grid, a node's edges leave and enter at the card's bottom and top, so they
never cross the parts above or below it. The group is the card:
it carries the frame, takes the same four frame props as a node, and its
nodes drop their own frame. An `accent` or `status` on any node in it
colours the whole group's frame, with the same precedence as on a node.

### Background

The diagram is a canvas, so it paints its own background. By default it
paints the page's canvas, the one `data-background-style` and
`data-background-strength` on `<html>` chose, so a Blueprint page gets
drawing guides in its diagrams and a solid page gets solid diagrams. A page
that set no canvas at all gets a dot grid, the lightest sign of a drawing
surface. `background` and `strength` override the page for one diagram,
with the same values minus the Momoi signatures, which belong to one shell:
`solid`, `dots`, `grid`, `crosses`, `construction`, `guides` or `fibers`.
This is the one exception to "cards never receive a pattern" in
[tokens](../tokens.md): the pattern is inside the panel, on the canvas, not
on the nodes.

## States

- **Running.** The default. No status is drawn, so a healthy diagram is
  quiet.
- **Stopped.** `status="stopped"` colours the frame `--color-border-strong`,
  mutes the node's text and adds a neutral [StatusBadge](status-badge.md)
  "Stopped".
- **Failed.** `status="failed"` colours the frame `--color-danger` and adds a
  danger StatusBadge "Failed".
- **Accent.** `accent` draws the frame in `--color-primary`. It marks the node
  the screen is about, such as the service on its own detail page. A status
  colour wins over accent.
- **Free text.** Text children render under the title in mono, muted. Line
  breaks are kept; text wraps past 48 characters, or earlier when the panel
  is narrow. It breaks at spaces and hyphens only, so a name with neither
  stays whole.
- **Folded.** A DiagramFold's head has `aria-expanded="false"`; its body
  keeps the node's width and has no height. A folded DiagramGroup has
  `data-open="false"` and its toggle `aria-expanded="false"`; its nodes
  show their icon and title only, and its footer leaves.
- **Filtered.** The pressed DiagramFilter chip has `aria-pressed="true"`.

Status changes the frame's colour and never its line, its corners or the
icon: a stopped database is still a database, drawn like its neighbours. A
node that is down usually pairs its status with `borderStyle="dash"`.

## Sizes

Columns are as wide as their content and sit together in the middle of the
panel. Rows are as wide as the widest row and no wider than the panel; grid columns
are as wide as their widest cell, and the bands as wide as all of them; spare room never stretches a node or its edges. The canvas fills the
panel, and node text, fact values and line ends wrap to fit it; titles,
captions, and fold and section headings never wrap. When even the wrapped
drawing is wider than the panel, wrapping would only cramp it, so the canvas
takes the drawing's natural width and the scroll region scrolls
horizontally. The gap
between columns is `--spacing-4xl`, and `--spacing-4xl` plus `--spacing-xl`
when any edge has a label, wide enough for one such as `DATABASE_URL`. The gap
between rows is the same. Nodes side by side, in a row or in a group,
sit `--spacing-4xl` apart, so an edge between them is at least 64px long and
reads as an arrow. In a grid, the
columns are `--spacing-3xl` plus `--spacing-md` apart and the bands
`--spacing-3xl`. Node
padding is `--presentation-panel-padding`; a fact row is at most 26rem wide.

## Accessibility

The scroll region is `role="group"` with the required `label`, which should
say what the drawing shows, not list its nodes. It is a group, not an image,
because nodes hold text and controls (folds, chips, add buttons, lines that
open something) that assistive technology must reach one by one. It is
focusable so a keyboard user can scroll it; the edges are `aria-hidden`. Node
text stays in the DOM in reading order, stage by stage. Status is text in
a badge, never only a colour or a dash. Edge labels are SVG text. A
group is `role="group"`, named by its title. A series edge carries
colour and dash, and its meaning is text in the key. Flow is decoration and
stops under `prefers-reduced-motion`.

A fold head, and the title of a collapsible group, is a button with
`aria-expanded` and `aria-controls`; Enter or Space toggles it and focus
stays on it. The group's group is named by that button. Filter chips are buttons with
`aria-pressed` in a group labelled "Show". An icon-only section action needs
an `aria-label`. On a coarse pointer, filter chips and line buttons are at
least `--size-touch-min` tall, and so is a group's toggle.

## Tokens and implementation

Fold and section heads, fact names, filter chips and line ends use
`--type-size-label`; counts use the `badge-count` Badge; rules and tree lines
use `--color-border` and `--color-border-strong`. Frames use the Card tokens plus `--color-primary` (accent, primary tone),
`--color-info` (database tone), `--color-border-strong` (neutral tone, edges,
stopped frame) and `--color-danger` (failed frame). Captions use `.t-caps`; titles
use `--type-weight-semibold`; free text and edge labels use `--font-mono`,
with labels at `--type-size-metadata`. The background pattern reads the
canvas variables that `data-background-style` sets for the shell. Groups
use `--color-border-strong` for the dashed frame and footer rule and
`--color-card` behind the title, the plates of turned labels, the gaps of
crossings and the knockouts under curved and straight edges. Series edges use `--color-chart-1` to
`--color-chart-5`, then the chart's generated colours.

```tsx
<Diagram label="honcho: two routes served by a repository backed by a database">
  <DiagramColumn>
    <DiagramNode id="host" kind="route" label="Hostname" title="honcho.momoi.internal">
      https://honcho.momoi.internal
    </DiagramNode>
    <DiagramNode id="path" kind="route" label="Path" title="tools.momoi.internal/honcho">
      https://tools.momoi.internal/honcho
    </DiagramNode>
  </DiagramColumn>
  <DiagramColumn>
    <DiagramNode id="repo" kind="repository" title="honcho" accent>
      {"github.com/momoi-labs/honcho\nport: 8000"}
    </DiagramNode>
  </DiagramColumn>
  <DiagramColumn>
    <DiagramNode id="db" kind="database" title="honcho-db">postgres:17</DiagramNode>
    <DiagramNode id="cache" icon={Zap} label="Cache" title="honcho-cache" status="failed" borderStyle="dash">
      redis:7
    </DiagramNode>
  </DiagramColumn>
  <DiagramEdge from={["host", "path"]} to="repo" label=":8000" />
  <DiagramEdge from="repo" to="db" label="DATABASE_URL" />
  <DiagramEdge from="repo" to="cache" label="REDIS_URL" line="dotted" tone="danger" />
</Diagram>
```

A structured summary, with a fold under the hostname, a node group and a
database list:

```tsx
<Diagram label="app: the routes that reach it and the database it uses">
  <DiagramColumn>
    <DiagramNode id="domains" icon={Globe} title="app.example.com">
      <DiagramFold title="Other routes" count={1}>
        <DiagramSection title="Aliases" icon={CornerDownRight} count={1} action={<AddButton />}>
          <DiagramLine>admin.example.com/</DiagramLine>
        </DiagramSection>
      </DiagramFold>
    </DiagramNode>
  </DiagramColumn>
  <DiagramColumn>
    <DiagramNodeGroup>
      <DiagramNode id="app" kind="repository" label="example" title="app" accent>
        <DiagramFact icon={Tag} label="Ref">main</DiagramFact>
        <DiagramFact icon={Plug} label="Port">:8787</DiagramFact>
        <DiagramFact icon={Terminal} label="Command" empty="Image default" />
      </DiagramNode>
      <DiagramNode id="containers">
        <DiagramFold title="Other containers" count={1}>
          <DiagramSection>
            <DiagramLine end="redis:7">cache</DiagramLine>
          </DiagramSection>
        </DiagramFold>
      </DiagramNode>
    </DiagramNodeGroup>
  </DiagramColumn>
  <DiagramColumn>
    <DiagramNode id="databases">
      <DiagramFold title="Databases" count={1}>
        <DiagramSection title="PostgreSQL" icon={Database} count={1}>
          <DiagramLine end={<Badge>DATABASE_URL</Badge>} onClick={openDatabase}>app-db</DiagramLine>
        </DiagramSection>
      </DiagramFold>
    </DiagramNode>
  </DiagramColumn>
  <DiagramEdge from="domains" to="app" />
  <DiagramEdge from="app" to="databases" />
</Diagram>
```

A cluster read top to bottom, with groups and series edges:

```tsx
<Diagram
  direction="down"
  label="Varejo Prod: cluster main, its standby clusters and their storage"
  footer={<>
    <DiagramEdgeKey series={1}>Replication inside a cluster</DiagramEdgeKey>
    <DiagramEdgeKey series={2}>Replication to a standby cluster</DiagramEdgeKey>
    <DiagramEdgeKey series={3}>WAL to storage</DiagramEdgeKey>
    <DiagramEdgeKey series={4}>Backups to storage</DiagramEdgeKey>
  </>}
>
  <DiagramRow justify="start">
    <DiagramGroup label="Cluster" title="main">
      <DiagramNode id="db1" icon={Database} label="Primary" title="DB1" accent>10.0.1.11 · tl 7</DiagramNode>
      <DiagramNode id="db2" icon={Database} label="Replica" title="DB2">10.0.1.12 · lag 0 B</DiagramNode>
    </DiagramGroup>
  </DiagramRow>
  <DiagramRow justify="between">
    <DiagramNode id="backup" icon={HardDrive} label="Backup storage" title="backup-01" />
    <DiagramGroup label="Standby cluster" title="reporting" footer={<>Backup <Badge>Off</Badge></>}>
      <DiagramNode id="db3" icon={Database} label="Standby leader" title="DB3" />
    </DiagramGroup>
  </DiagramRow>
  <DiagramEdge from="db1" to="db2" series={1} flow label="0 B" />
  <DiagramEdge from="db2" to="db3" series={2} flow label="12 MB" />
  <DiagramEdge from="db1" to="backup" series={3} flow label="WAL" />
  <DiagramEdge from="db2" to="backup" series={4} flow label="backups" />
</Diagram>
```

Two sites on a grid, solid groups holding dashed ones, with crossings
marked by gaps:

```tsx
<Diagram direction="grid" columns={2} crossings="gap" label="Varejo Prod: two sites with their clusters and storage">
  <DiagramGroup line="solid" label="Site" title="on-premises">
    <DiagramColumn>
      <DiagramGroup label="Cluster" title="main">
        <DiagramNode id="db1" icon={Database} label="Primary" title="DB1" accent />
        <DiagramNode id="db2" icon={Database} label="Replica" title="DB2" />
      </DiagramGroup>
      <DiagramNode id="backup" icon={HardDrive} label="Backup storage" title="backup-01" />
    </DiagramColumn>
    <DiagramColumn>
      <DiagramGroup label="Standby cluster" title="reporting">
        <DiagramNode id="db3" icon={Database} label="Standby leader" title="DB3" />
      </DiagramGroup>
    </DiagramColumn>
  </DiagramGroup>
  <DiagramGroup line="solid" label="Site" title="AWS sa-east-1">
    <DiagramColumn>
      <DiagramNode id="s3" icon={Cloud} label="Object storage" title="s3-varejo" />
    </DiagramColumn>
    <DiagramColumn>
      <DiagramGroup label="Standby cluster" title="cloud">
        <DiagramNode id="nuv1" icon={Cloud} label="Standby leader" title="NUV1" />
      </DiagramGroup>
    </DiagramColumn>
  </DiagramGroup>
  <DiagramEdge from="db1" to="db2" series={1} flow label="Lag: 0 B" />
  <DiagramEdge from="db2" to="db3" series={2} flow label="Lag: 12 MB" />
  <DiagramEdge from="db2" to="nuv1" series={2} flow label="Lag: 2.1 GB" />
  <DiagramEdge from="db1" to="backup" series={3} flow />
  <DiagramEdge from="db1" to="s3" series={3} flow label="WAL" />
  <DiagramEdge from="db2" to="backup" series={4} flow />
  <DiagramEdge from="db2" to="s3" series={4} flow label="backups" />
</Diagram>
```

`DiagramEdge` renders nothing; it registers with the Diagram, which draws it
once the nodes are measured. Node ids are unique within one Diagram.

## When to use

- The summary of a deployed service: what reaches it, what runs it, what it
  depends on.
- A fixed topology of two to four stages that reads left to right.
- A cluster and what hangs from it, read top to bottom: members, standbys,
  storage.
- A topology with two axes on shared columns, such as groups that each hold
  clusters and storage.

## When NOT to use

- Facts about one object with no connections. Use [KV](kv.md).
- A graph the user edits, drags or zooms. Diagram is a drawing of a known
  shape, not an editor.
- Many nodes or cycles. Edges go one way; a mesh needs a layout engine.
