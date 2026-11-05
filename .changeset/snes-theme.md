---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
"kiso-tokens": minor
---

Add the `snes` accent, four new background decks, a glass panel fill, and a floating header variant.

The `snes` accent is the Super Nintendo theme: a purple ramp over warm beige neutrals in light mode and warm graphite neutrals in dark mode. Like `nocturne` it restates the neutral roles. The `kiso-tokens` crate gains the accent.

Four background decks join the shell canvas and work under every accent: `checker`, `stripes`, and `rings` ink from border tones, and `glow` washes in the active accent ramp. A new `data-panel-fill="glass"` value fills panels at a lower translucency with a backdrop blur; logs keep their solid dark terminal.

`Header` and `ApplicationShell` gain a `floating` variant: the bar detaches from the page edges with a margin, rounded corners, and a contact shadow, and stays pinned below the viewport top while content scrolls behind it.

The `bevel` border style now paints light from above and a soft cast below instead of dark on both edges.

Header gains Compact, Default, and Editorial sizes independent of its variant. The gallery exposes header size in the component example and Appearance settings.
