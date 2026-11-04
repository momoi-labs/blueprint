---
"@momoi-labs/kiso": patch
---

Draw neutral canvas patterns in border ink so they recede behind text. Keep translucent panels at the existing 65% fill with their full-contrast text.

Exclude the inset shell shadow from the desktop content scroller and clip the content scrollbar to the Pixel corners. This prevents white scrollbar paint from leaking into the corners when zoom changes the layout.

Paint the outer Pixel border above the sticky header so it remains visible at fractional zoom.
