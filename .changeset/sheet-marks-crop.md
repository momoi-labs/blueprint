---
"@momoi-labs/kiso": patch
---

Sheet clearance (`data-mark-clearance="sheet"`) draws corner marks that match on every side. Ticks are now crop marks: each arm runs along a side of its panel, one gap from the crossing, instead of pointing away from it. Ticks and brackets are drawn on whole device pixels, so their stroke no longer changes from mark to mark at a fractional display scale such as 1.6. Arcs and diagonals no longer move to the center of the grid gap, where they met as chevrons; they stay at their own panel as in `normal`.
