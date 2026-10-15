---
"@momoi-labs/kiso": patch
"@momoi-labs/kiso-react": patch
---

ApplicationShell with `phoneNavigation="bottom"` now shows `primaryAction` in the header, after the brand, below 700px. Before, the menu button was hidden and neither the bar nor the More sheet held it, so a phone could not reach it. A menu passed as `primaryAction` opens from the header. From 700px the drawer and sidebar hold it as before.
