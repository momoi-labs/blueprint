---
"@momoi-labs/kiso-react": minor
"@momoi-labs/kiso": minor
---

Add table density, header treatment and an optional frameless wrapper.

Add an optional rail appearance to Alert and use the contracted body
typography for descriptions.

Allow ApplicationShell to place its sidebar toggle in the header while
preserving expanded state, labels and focus recovery.
Add AppShellPanel for an optional end panel. Hidden navigation and panel
columns release their space independently. ApplicationShell accepts a panel
slot in both layouts.
Keep the inset main frame and its corner marks above both adjacent rails.
AppShellPanelToggle can stay in the header or float beside the panel edge.
Floating placement reserves space so the toggle does not cover main content
or its scrollbar.

Add inline FormField labels, decorative icons and described unit suffixes.
Input, SelectTrigger and FormField now share optional controlSize settings.

Add solid and frameless border styles with independent corner shapes.
Use `data-corner-style="rounded"` with a separate size to choose roundness.
Preserve legacy border values and keep control borders and focus visible in
frameless regions.

Keep long inline Select values clear of the chevron and allow selected column
styles to override the plain table header.
