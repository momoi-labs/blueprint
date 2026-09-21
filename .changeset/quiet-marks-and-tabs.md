---
"@momoi-labs/kiso": patch
---

Keep hidden corner marks and the selected tab's underline inside their boxes.
Marks turned off with `--corner-mark: 0` or `data-corner-marks="none"` no longer
reach outside the frame, and the tab underline no longer ends one pixel past the
button, so a scroll container around a panel or a sideways-scrolling tab strip
stops showing scrollbars for pixels nobody sees.
