---
"@momoi-labs/kiso": patch
---

Make DashboardPanel content fill the row. Panels in one grid row already
shared a height, but the Card inside kept its content height, so a short
Stat or Meter ended above its neighbour with bare background below. The panel
is now a grid, so its child stretches to the row.
