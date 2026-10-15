---
"@momoi-labs/kiso": patch
---

Sticky FormActions now stop above the BottomNav on phones. The fixed bar covered the save bar while a tall form scrolled. A shell with a bar sets `--shell-bottom-inset` to the bar's height plus the safe area below 700px, and sticky FormActions use it as their bottom offset. Pages without a bar, and sticky actions in a `form-scroll` region, keep a zero offset.
