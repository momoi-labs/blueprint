---
"@momoi-labs/kiso-react": minor
"@momoi-labs/kiso": patch
---

Chart and ChartLegend accept any number of series. Slots 1 to 5 keep the
validated palette. Slot 6 and later get a generated color in the same
lightness band for each theme, starting with the hues between the palette's
own. Generated colors are not checked for color-vision deficiency, so the
numbered label and exact values carry identity.
