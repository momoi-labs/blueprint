# Diagram

## Purpose

Diagram shows how the parts of a deployment connect: the routes that reach a
service, the image or repository that runs it, the database and cache behind
it. It is read left to right, one column per stage, and it is a drawing, not
a list. The same drawing appears on a wide screen and on a phone; on a phone
it scrolls.

## Anatomy

```
Diagram (.card.diagram, optional data-background-style and data-background-strength)
└── scroll region (.diagram-scroll, role="img", tabindex="0")
    └── canvas (.diagram-canvas): paints the background pattern
        ├── lanes (.diagram-lanes): one DiagramColumn per stage
        │   └── DiagramNode (.card.diagram-node, data-kind, data-tone, data-status)
        │       ├── kind row: icon + caption (.t-caps)
        │       ├── title (.diagram-node-title)
        │       ├── free text (.diagram-node-text, .mono, optional)
        │       └── StatusBadge (optional)
        └── edges (svg.diagram-edges): one elbow path per source, labels
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
arrowhead. Several sources into one target share the run into it. An edge
label sits above that run in mono, with a stroke in the card colour knocking
the line out behind it. Edges are measured from the rendered nodes, so they
follow font loading, wrapping and resizing.

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
- **Free text.** Children render under the title in mono, muted. Line breaks
  are kept; text wraps only past 48 characters.

Status changes the frame's colour and never its line, its corners or the
icon: a stopped database is still a database, drawn like its neighbours. A
node that is down usually pairs its status with `borderStyle="dash"`.

## Sizes

Columns are as wide as their content and share the free space when the panel
is wider than the drawing. The canvas is never narrower than the panel and
never wraps a title; when the drawing is wider than the panel the scroll
region scrolls horizontally and the drawing keeps its proportions. The gap
between columns is `--spacing-4xl` plus `--spacing-xl`, wide enough for an
edge label such as `DATABASE_URL`. Node padding is
`--presentation-panel-padding`.

## Accessibility

The scroll region is `role="img"` with the required `label`, which should say
what the drawing shows, not list its nodes. It is focusable so a keyboard
user can scroll it; the edges are `aria-hidden`. Node text remains in the
DOM in reading order, column by column, so a screen reader can still read
the facts if it steps into the image. Status is text in a badge, never only a
colour or a dash. Edge labels are SVG text and are read with the drawing.

## Tokens and implementation

Frames use the Card tokens plus `--color-primary` (accent, primary tone),
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
