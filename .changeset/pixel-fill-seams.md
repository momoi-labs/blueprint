---
"@momoi-labs/kiso": patch
"@momoi-labs/kiso-react": patch
---

Remove the thin lines across Pixel panels, the floating Header and controls at fractional browser zoom, such as 80%, 110% or a 1.75 device pixel ratio. Panels and the floating Header now paint their Pixel fill as one shape in the `.panel-shadow` layer, which gains a second empty span. Native markup without that span keeps the older fill. Controls and navigation items paint their fill from overlapping layers, so no edge falls between two of them.
