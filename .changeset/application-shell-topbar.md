---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

ApplicationShell `layout="topbar"` for single-surface chrome without a sidebar

Single-page products need the shared shell API with brand and primary action in
the top bar, not a permanent rail. Topbar mode omits Sidebar, rejects
navigation/footer at the type level, and uses `.app-shell[data-layout="topbar"]`
for one main column at every width. Default remains sidebar.
