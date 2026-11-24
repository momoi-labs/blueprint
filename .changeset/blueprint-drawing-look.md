---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
"kiso-tokens": minor
---

Add the `blueprint` accent: blue ink on a warm off-white sheet in light, pale ink on saturated navy in dark. It restates the neutral and status roles.

Add four appearance attributes for every look: `data-technical-text="mono"`, `data-control-style="tactile"`, `data-progress-style="segmented"` and `data-panel-labels="numbered"`.

Add `data-chart-palette="mono"` for the Blueprint look only. It draws every chart series in the foreground ink and tells series apart by line dash, square markers and, in a stacked chart, a hatch per band. `Chart` sets `data-variant` on its figure and `ChartTreatment` has a `mono` flag.

Sheet clearance now makes neighboring marks meet at one point: `.page` stacks its blocks at the grid gap under `data-mark-clearance="sheet"`, and panels without a border under `data-frame-scope="outer"` no longer sit 1px off. A `TimeRangeControl` in live mode joins a following button inside a `.btn-group`.
