---
"@momoi-labs/kiso-react": minor
"@momoi-labs/kiso": minor
---

The table legend takes a `summary` prop on `Chart` and `ChartLegend` that
lists its columns in order. Besides `min`, `max`, `avg` and `current`, it
offers `p50`, `p75`, `p90`, `p95` and `p99`, so spiky measures such as
latency can show percentiles instead of a max set by one outlier. The
default columns do not change.
