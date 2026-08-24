---
"@momoi-labs/kiso": minor
---

Stop `.logview` and `pre` from scrolling for their own corner marks

The corner marks are absolutely positioned outside the frame they decorate, so
any element that draws them and also sets `overflow` scrolls a few pixels of
its own decoration — `.logview` showed both scrollbars while empty, and `pre`
showed a spurious horizontal one. `.table-wrap` already answered this by
putting the frame on one element and the scrolling on `.table-scroll` inside
it; `.logview` and `pre` now do the same.

**Breaking for consumers of `ui.css`:** log lines go inside a
`<div class="log-scroll">` within `.logview`, and code goes inside `<code>`
within `<pre>`. Height still goes on `.logview`; the scroller takes what is
left of it.
