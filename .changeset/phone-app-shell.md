---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Fit the inset app shell to phones. Below 700px wide the inset frame now meets
the screen edges: no outer padding, canvas margin, border, corners or corner
marks. Wider screens are unchanged. `data-app-shell-outer` on `html` chooses
`full`, `compact` or `none` at every width instead; `auto`, the default, keeps
the new behavior.

Add `BottomNav`, `BottomNavLink` and `BottomNavBadge` for a phone's main
destinations in a bar fixed to the bottom edge below 700px. A sidebar
ApplicationShell builds the bar from its navigation with
`phoneNavigation="bottom"` and keeps the drawer between 700px and 1023px. A
top-bar ApplicationShell takes a BottomNav in its `bottomNav` slot. The shell
reserves space so the last content scrolls clear of the bar.

`.topbar` now has a minimum height instead of a fixed one, so wrapped header
content stays inside it. Header content taller than 52px now grows the bar
instead of spilling over its border. The Momoi watermark is at most 64px wide
below 700px.
