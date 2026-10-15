---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

ApplicationShell, Tabs and Lifecycle now fit a phone.

- ApplicationShell: below 1024px the sidebar leaves the page and opens as a drawer from a menu button at the start of the header. The drawer holds the brand, the primary action, the navigation and the footer, and closes when a destination is picked. Pass `drawerOpen` and `onDrawerOpenChange` to close it from somewhere the drawer cannot see, such as a menu that opens in a portal. A sidebar laid out by hand with AppShell keeps the stacked navigation.
- Tabs: the new `sections` prop shows each panel under a header of its own below 1024px, one open at a time, instead of a strip of triggers that cannot fit. The panels are the same elements in both layouts, so crossing the breakpoint keeps an edited form or a running terminal.
- Lifecycle: at 720px and below the status stays in the row and every action moves into a bottom sheet behind a "More actions" button. `actionsLabel` names the sheet. Status badges wrap instead of running off the screen.
