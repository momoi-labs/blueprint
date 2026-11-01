---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Diagram reads top to bottom: `direction="down"` with `DiagramRow` stages, and
edges between two nodes of the same stage. `DiagramGroup` frames several
nodes with its name on the border. Series edges tell kinds of link apart by
chart colour and dash, can flow toward the target, and `DiagramEdgeKey` draws
their key.

`direction="grid"` lays bands of columns that line up across
groups, such as sites, and each edge picks a side, down or drop route
that keeps crossings to a minimum. Edges with one source and one series share
a trunk that splits at a dot. `crossings` marks where edges cross frames or
other edges with a hop or a gap, and `labels` turns labels on vertical runs.
Groups nest and take a line (dashed, solid, dotted) and a tone.

Nodes side by side sit 64px apart, a group keeps room on the sides where
edges come in, a label between two groups sits in the gap between them,
side edges run level when they can, and `footer` places the key inside the
card.

A collapsible `DiagramGroup` folds to one line of its nodes, icon and
title, keeps its size across the flow, and edges to those nodes reach the
frame instead.

Left to right, top to bottom and grid route edges the same way, and groups
work in all three: a group can hold columns or rows of its own. Edges keep
their channels out of nodes and of groups they do not enter, and an edge
that would cross a node runs straight past it.
