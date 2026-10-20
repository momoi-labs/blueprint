---
"@momoi-labs/kiso-react": minor
"@momoi-labs/kiso": minor
---

DashboardPanel takes `expandable`. The panel gets an Expand control with a
maximize icon, and `V` opens the focused panel, or the one under the pointer,
in a dialog that fills the viewport. `Escape`, `V` or Close returns focus to
where it was. A Chart in the expanded panel takes the height the dialog leaves
and stops synchronizing with the Charts on the grid. Expanding never writes to
the layout.
