---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Let Diagram draw structured summaries. Nodes take facts (`DiagramFact`), a
fold with a count (`DiagramFold`), filter chips (`DiagramFilter`), sections
with an action (`DiagramSection`) and tree lines (`DiagramLine`).
`DiagramNodeGroup` draws several nodes as one card. `title` is optional and
takes any node, and an icon without a caption leads the title.

The canvas now fills its panel and wraps node text to fit; a drawing too
wide even when wrapped keeps its natural width and scrolls.
Columns sit together in the middle instead of stretching. The column gap
shrinks when no edge has a label. Several edges into one target each get
their own entry point, so their labels no longer overlap. The scroll region
is `role="group"` instead of `role="img"`, so assistive technology reaches
the controls inside nodes.
