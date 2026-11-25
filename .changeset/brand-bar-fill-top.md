---
"@momoi-labs/kiso": patch
---

With `data-brand-bar="full"` on an inset shell, the brand fill now starts at
the top edge of the main panel, so the brand cell and the top bar line up.
Before, on a patterned canvas, the fill began at the top of the sidebar and
showed as a strip above the top bar. With `data-border-style="none"`, the
shell also kept a 1px offset for a border that the main panel no longer draws.
