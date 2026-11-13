---
"@momoi-labs/kiso": patch
---

Fix the floating Header with Pixel and Asymmetric corners. Pixel now draws the stepped border and fill without trimming the border on its outer edge, and Asymmetric uses the same corner pair as panels. Header side padding now matches the gap above and below one line of text in every size, so content no longer sits closer to the sides than to the top and bottom.
