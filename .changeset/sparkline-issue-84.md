---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

add Sparkline for single-series metric trends

The self-host console needed the shape of one metric at cell size three
times over, which is the evidence the v1 chart deferral asked for. The
component draws one series with Recharts using tokens only: neutral by
default, tone="primary" for the series a tile is about, nothing drawn below
two samples. The ui.css chart area becomes a flat token fill, removing the
document-level gradient id no component defined.
