---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Diagram has a neutral series: `series="neutral"` on `DiagramEdge` and
`DiagramEdgeKey` draws a link in the muted text grey with a dash no chart
slot uses. It is for a link that must be told apart but should not draw the
eye, such as WAL next to replication. A chart slot's colour can read as a
status next to a warning badge.

`StatusBadge` takes `series` in place of `tone` for a state that belongs to
a Diagram edge, such as "Streaming" on the node a replication edge feeds.
The fill, the border and the mark take the series colour. An optional
`icon` replaces the dot and pulses like it. The StatusBadge contract says
when a series colour is allowed.

`DiagramFact` rows placed directly in a `DiagramFold` now sit at the node's
padding, as they do in the node body.
