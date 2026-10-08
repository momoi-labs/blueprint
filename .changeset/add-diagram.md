---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Add Diagram: columns of typed nodes (route, service, repository, image,
database, or a custom icon) joined by elbow edges with optional labels,
dashed or dotted lines and a status tone. Nodes are Cards with a title, free
text and an optional stopped or failed status.
They follow the page's appearance, or take their own border style, corner
style, corner size and corner marks on the diagram, with a per-node override
for one node that is down. The diagram is a panel that paints the page's
canvas background, or one of the shell's background styles of its own, and
it keeps its width on narrow screens by scrolling instead of reflowing. Icons come from `lucide-react`, which is
now a peer dependency of `@momoi-labs/kiso-react`.
