---
"@momoi-labs/kiso-react": patch
"@momoi-labs/kiso": patch
---

A Dialog or AlertDialog opened from inside another Dialog now paints its scrim over the outer Dialog, so the outer one is dimmed and no part of it shows above the inner one. Dialog, Drawer and CommandPalette content now share the overlay's z-index, and the later portal paints on top. The Modal/Dialog docs describe how to nest.
