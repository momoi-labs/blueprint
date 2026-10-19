---
"@momoi-labs/kiso-react": minor
"@momoi-labs/kiso": minor
---

Chart treatment splits into a line and a fill, so a curved line can keep the
dot screen. `data-chart-line` takes `straight`, `stepped` or `curved`.
`data-chart-fill` takes `none`, `dots`, `tint`, `squares` or `scanlines`.
`data-chart-style` stays as a preset of both, and the new attributes override
one axis. Chart and Sparkline add `chartLine` and `chartFill` props. Chart and
Sparkline now mark their treatment with `data-line` and `data-fill` instead of
`data-chart-treatment`. A gauge keeps a solid value with any fill, and its
track is plain with none or tint.

Chart layout and legend placement are inheritable too. `data-chart-layout`
takes `standard`, `compact` or `split`, and `data-chart-legend` takes `table`,
`inline` or `sidebar`. The `layout` and `legend` props override them. An
inherited split leaves a stacked chart on one plot.
