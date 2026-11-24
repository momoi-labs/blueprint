---
"@momoi-labs/kiso": patch
---

A `PageHeader` with actions keeps its full height in a `.page` that scrolls. The 32px floor sat on the header row, which replaced its content minimum, so a page taller than its shell shrank the row to 32px and the title and description ran under the next block. The floor now sits on the title block.
