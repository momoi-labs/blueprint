---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Diagram draws an edge to a node above its source, such as a replica that
restores WAL from the storage under its cluster. The edge takes the route the
edge down from that node would take, drawn backward: out the top or a side,
into the bottom of the target. Left to right, an edge to a column on the left
comes into the target's right side. Before, such an edge was not drawn.
