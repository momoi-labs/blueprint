---
"@momoi-labs/kiso-react": minor
"@momoi-labs/kiso": patch
---

Diagram edges now use four anchors per node, one in the middle of each side. Each edge takes the anchor pair with the shortest clear orthogonal path, and detours through a gutter or around a frame instead of crossing a card, a group title or a group that holds neither end. Edges of one kind on one anchor share a trunk and part at a dot. Labels keep off cards, titles, footers, borders, other labels and other edges. `DiagramEdge` gets `fromSide` and `toSide` to force a side.
