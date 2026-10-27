---
"@momoi-labs/kiso": patch
---

Sheet mark clearance puts every corner mark style on the center of the grid
gap, so the marks of neighbouring panels join into one shape: a cross or a tee
for brackets, a crop cross for ticks, one dot for dots. Before, they crossed
each other and drew a "#" in the gap. Brackets are now drawn as solid 1px
lines, so a shared line has the same width as a single one. A pane row that
scrolls now leaves room for sheet marks instead of clipping them.
