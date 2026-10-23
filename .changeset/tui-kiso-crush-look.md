---
"@momoi-labs/kiso": major
---

The terminal contract now follows the Crush-style look of `tui-kiso`, and
products built on the old rules no longer match it. Breaking: the screen
stays unpainted, with the terminal's colors set by OSC 11 and OSC 10;
sections are a title and a rule, not a filled bar; the selected row gets a
`▌`; dialogs have a rounded `primary` frame on `background`, not an
elevated fill; key hints show the key in `foreground`; and `Ctrl+P` opens
the command palette, with `:` as an alias and `Ctrl+K` no longer used.

The contract adds the sidebar, scrolling, forms, the `/` search, faceted
filters on `f`, record details as a page, tabs on a detail page, row actions
on `a`, the order in which keys reach each layer, and how work in progress
shows. A light theme is allowed when the person picks it. Button, Form,
Command palette, Sidebar, Toast, Spinner, Tabs, Page header, Search, Theme
selector, Step list, Dropdown menu and Drawer gain or update a Terminal
section, and the filtering pattern gains one.
