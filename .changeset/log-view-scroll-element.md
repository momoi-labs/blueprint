---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Let products virtualize LogView. `LogViewHandle` adds `getScrollElement()`,
which returns the internal scroller to hand to a virtualizer such as TanStack
Virtual. Follow-tail no longer pulls back a reader who leaves the end in small
steps while a virtualized body re-renders its rows. The LogView contract
explains how to compose a virtualized body.
