---
"@momoi-labs/kiso": patch
---

A pixel Textarea no longer paints over a layered editor. The pixel rules kept the field-control exclusion outside `:where()`, which raised their specificity to two classes. A later single-class `background: transparent` now clears the pixel fill.
