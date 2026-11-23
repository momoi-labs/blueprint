# kiso-tokens

## 0.7.0

### Minor Changes

- c39aee6: Alert gets `appearance="loud"`: a solid status fill with hazard tape and a filled icon, for blocking incidents. Alert also gets `tape`, `animated`, `pulse`, `placement="overlay"` (rendered in a portal on `document.body`, one at a time, "+N" for the rest), `onDismiss` with a rendered Dismiss button, `AlertDetails`, a disclosure, and `AlertLabel`, `AlertMessage` and `AlertMeta` for a caps label, a mono message and a caps mono meta line. An overlay Alert is opaque in every appearance. Inline code in a loud Alert or Toast keeps the loud foreground, with a faint border instead of the muted chip. Toast gets `appearance="loud"`, and `notify` takes `{ appearance, pulse }` as a fourth argument; a loud error Toast stays until dismissed. New tokens: `danger-solid`, `warning-solid`, `info-solid`, `success-solid` with their `-foreground` pairs, and `tape`.

## 0.6.0

### Minor Changes

- 60c29b7: Add the `pine` accent: a deep green ink and fill with a sage step, warmer and
  greener than `teal`. Neutrals stay unchanged. The `kiso-tokens` crate gains
  `PINE_LIGHT` and `PINE_DARK`, and the tui-kiso theme picker lists the accent.

## 0.5.0

### Minor Changes

- 1ea6579: Add the `snes` accent, four new background decks, a glass panel fill, and a floating header variant.
  
  The `snes` accent is the Super Nintendo theme: a purple ramp over warm beige neutrals in light mode and warm graphite neutrals in dark mode. Like `nocturne` it restates the neutral roles. The `kiso-tokens` crate gains the accent.
  
  Four background decks join the shell canvas and work under every accent: `checker`, `stripes`, and `rings` ink from border tones, and `glow` washes in the active accent ramp. A new `data-panel-fill="glass"` value fills panels at a lower translucency with a backdrop blur; logs keep their solid dark terminal.
  
  `Header` and `ApplicationShell` gain a `floating` variant: the bar detaches from the page edges with a margin, rounded corners, and a contact shadow, and stays pinned below the viewport top while content scrolls behind it.
  
  The `bevel` border style now paints light from above and a soft cast below instead of dark on both edges.
  
  Header gains Compact, Default, and Editorial sizes independent of its variant. The gallery exposes header size in the component example and Appearance settings.

## 0.4.0

### Minor Changes

- 580c85f: Add three accents: `plum`, `stone` (a warm gray in the paper's hue) and
  `steel` (a blue-gray). Under the gray accents, plain links are underlined at
  rest, because a gray link has about the color of muted text. The
  `kiso-tokens` crate gains the three accents, and the tui-kiso theme picker
  lists them.

### Patch Changes

- 7f1c5e2: Tune the existing accents. The tangerine ramp moves toward orange, so its
  tints no longer match terracotta. Nocturne gets its own muted indigo ramp,
  apart from violet. The dark `primary-hover` of violet, teal, cobalt and
  nocturne now keeps its text at 4.5:1.

## 0.3.0

### Minor Changes

- c15c54b: Add CodeBlock for read-only code, and syntax roles for highlighted code.
  
  - CodeBlock shows commands, values, configuration and line diffs in a panel, with an optional title, terminal mark and labelled Copy. Copy confirms with a Toast and falls back to a selection copy on plain HTTP.
  - `lineNumbers`, `added`, `removed`, `diff` and `collapse` add numbers, `+` and `−` markers with "Added line" and "Removed line" labels, and folded ranges.
  - `highlight` has CodeEditor's signature, so one highlighter paints examples and editors. Tokens may span lines.
  - Five syntax roles, `--color-code-comment`, `--color-code-keyword`, `--color-code-string`, `--color-code-constant` and `--color-code-name`, alias gated text roles. The AA gate checks them, and `.code-*` classes apply them. Data interfaces now allow highlighting with these roles only.

## 0.2.0

### Minor Changes

- 4bc8010: Add `success-on-dark`, so a terminal or log view can show success in the same
  dark-surface family as warning, danger and info. The terminal contract now
  picks the 256-color selected row by the accent's hue first, because the
  nearest color by distance turns gold into dark red.

## 0.1.1

### Patch Changes

- f38f222: Link the crate to kiso.momoi-labs.dev and the terminal interfaces contract.
