# Diagram

## Purpose

Diagram shows how the parts of a deployment connect: the routes that reach a
service, the image or repository that runs it, the database and cache behind
it. It is read left to right, one column per stage, and it is a drawing, not
a list. On a narrower panel node text wraps to fit; when even the wrapped
drawing does not fit, the drawing keeps its natural width and scrolls.

## Anatomy

```
Diagram (.card.diagram, optional data-background-style and data-background-strength)
└── scroll region (.diagram-scroll, role="group", tabindex="0")
    └── canvas (.diagram-canvas): paints the background pattern
        ├── lanes (.diagram-lanes): one DiagramColumn per stage
        │   ├── DiagramNode (.card.diagram-node, data-kind, data-tone, data-status)
        │   │   ├── kind row: icon + caption (.t-caps, optional)
        │   │   ├── title (.diagram-node-title, optional): led by the icon when there is no caption
        │   │   ├── free text (.diagram-node-text, .mono, optional)
        │   │   ├── StatusBadge (optional)
        │   │   └── parts (optional): DiagramFact rows, DiagramFold
        │   └── DiagramNodeGroup (.card.diagram-node-group): several nodes drawn as one card
        └── edges (svg.diagram-edges): one elbow path per source, labels

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

Edges leave the right edge of each source, turn onto a shared merge column
with an 8px radius, and enter the left edge of the target with one filled
arrowhead. Several sources in one `DiagramEdge` share the run into the
target. Several `DiagramEdge`s into the same target each get their own entry
point, spread down the target's side in the order of their sources, so their
arrowheads and labels never land on the same spot. An edge label sits above
its run into the target in mono, with a stroke in the card colour knocking
the line out behind it. Edges are measured from the rendered nodes, so they
follow font loading, wrapping, folding and resizing.

An edge's `line` is `solid` by default; `dashed` or `dotted` says the link
is not serving. Its `tone` is `neutral` by default; `success` or `danger`
colours the line and its arrowhead with the matching status colour, the same
three readings as [StatusBadge](status-badge.md). A dotted danger edge into
a failed node is how a dependency that is down reads at a glance. The line
and tone start at the turn onto the merge column: the run out of the source
is shared by every edge that leaves it, so it stays solid and neutral, and
each branch past the turn says how its own link is doing.

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
that receives requests, not the middle of the card. The group is the card:
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
  keeps the node's width and has no height.
- **Filtered.** The pressed DiagramFilter chip has `aria-pressed="true"`.

Status changes the frame's colour and never its line, its corners or the
icon: a stopped database is still a database, drawn like its neighbours. A
node that is down usually pairs its status with `borderStyle="dash"`.

## Sizes

Columns are as wide as their content and sit together in the middle of the
panel; spare room never stretches a node or its edges. The canvas fills the
panel, and node text, fact values and line ends wrap to fit it; titles,
captions, and fold and section headings never wrap. When even the wrapped
drawing is wider than the panel, wrapping would only cramp it, so the canvas
takes the drawing's natural width and the scroll region scrolls
horizontally. The gap
between columns is `--spacing-4xl`, and `--spacing-4xl` plus `--spacing-xl`
when any edge has a label, wide enough for one such as `DATABASE_URL`. Node
padding is `--presentation-panel-padding`; a fact row is at most 26rem wide.

## Accessibility

The scroll region is `role="group"` with the required `label`, which should
say what the drawing shows, not list its nodes. It is a group, not an image,
because nodes hold text and controls (folds, chips, add buttons, lines that
open something) that assistive technology must reach one by one. It is
focusable so a keyboard user can scroll it; the edges are `aria-hidden`. Node
text stays in the DOM in reading order, column by column. Status is text in
a badge, never only a colour or a dash. Edge labels are SVG text.

A fold head is a button with `aria-expanded` and `aria-controls`; Enter or
Space toggles it and focus stays on it. Filter chips are buttons with
`aria-pressed` in a group labelled "Show". An icon-only section action needs
an `aria-label`. On a coarse pointer, filter chips and line buttons are at
least `--size-touch-min` tall.

## Tokens and implementation

Fold and section heads, fact names, filter chips and line ends use
`--type-size-label`; counts use the `badge-count` Badge; rules and tree lines
use `--color-border` and `--color-border-strong`. Frames use the Card tokens plus `--color-primary` (accent, primary tone),
`--color-info` (database tone), `--color-border-strong` (neutral tone, edges,
stopped frame) and `--color-danger` (failed frame). Captions use `.t-caps`; titles
use `--type-weight-semibold`; free text and edge labels use `--font-mono`,
with labels at `--type-size-metadata`. The background pattern reads the
canvas variables that `data-background-style` sets for the shell.

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

`DiagramEdge` renders nothing; it registers with the Diagram, which draws it
once the nodes are measured. Node ids are unique within one Diagram.

## When to use

- The summary of a deployed service: what reaches it, what runs it, what it
  depends on.
- A fixed topology of two to four stages that reads left to right.

## When NOT to use

- Facts about one object with no connections. Use [KV](kv.md).
- A graph the user edits, drags or zooms. Diagram is a drawing of a known
  shape, not an editor.
- Many nodes or cycles. Columns go one way; a mesh needs a layout engine.
