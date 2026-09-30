---
"@momoi-labs/kiso-react": minor
"@momoi-labs/kiso": minor
---

Add optional sidebar collapse with keyboard controls, accessible navigation,
controlled state, and support for existing appearance settings.

Add editorial PageHeader and inset AppShell variants. The inset frame follows
Appearance settings, and existing layouts remain the default. Support global
visual style and frame preferences, with component variants taking precedence.
Editorial now shares presentation tokens across page and section titles,
cards, metrics, and layout spacing while retaining control and table density.
Regions can opt into the default style independently.

Keep the desktop inset frame and its header visible while page content scrolls
inside it, preserving the top border, gutter, and corner marks.

Add a cards variant to ThemeSelector with labeled system, light, and dark
previews. Preserve the compact default and the same radio keyboard controls.
