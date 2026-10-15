---
"@momoi-labs/kiso": patch
"@momoi-labs/kiso-react": patch
---

Phone polish from the component review.

- Chart: the last x-axis label is no longer cut.
- Table, Chart data table, ChartLegend, Diagram and horizontal Steps fade the edge that has more content behind it when they scroll sideways.
- Steps: a horizontal list no longer breaks words mid-word. It scrolls instead.
- Button `xs` is 44px wide on a coarse pointer.
- Select: the listbox is never narrower than its trigger.
- Bottom sheets keep their content above the safe area at the bottom of the screen.
- AlertDialog: tapping the backdrop keeps focus inside the dialog.
- KV: the key column takes at most 30% of the list when the list is narrow.
