---
"@momoi-labs/kiso": patch
---

Fix StatDelta variants rendering as neutral. `.badge-outline` came later in
the cascade than the bare `.success`/`.warning`/`.danger`/`.info` colour
classes, so every delta showed muted text. The variant now colours the text and
frame while keeping the outline treatment the spec describes.
