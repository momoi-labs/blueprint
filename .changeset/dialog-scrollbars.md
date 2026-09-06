---
"@momoi-labs/kiso-react": patch
---

Stop the dialog surface from showing two scrollbars on content that fits. The
corner marks are drawn outside the surface, so `overflow-y: auto` on the same
element had something to scroll to at every size. The surface is now a flex
column and the content region scrolls.
