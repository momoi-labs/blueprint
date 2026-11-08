# WindowFrame

## Purpose

WindowFrame puts window chrome around an example of a product: a terminal
session, a console screen or a chat. It tells the reader "this is what you
will see", on a site page.

## Anatomy

```
WindowFrame: figure
├── Card
│   ├── bar: three dots and the title
│   └── body (children)
└── caption (optional): figcaption
```

```tsx
<WindowFrame variant="terminal" title="ssh db-prod-01" caption="Nothing leaves the server.">
  {transcript}
</WindowFrame>
```

## Variants

| `variant` | Behavior |
| --- | --- |
| `app` (default) | The body is free; the product lays it out. |
| `terminal` | A dark surface in any theme, `--font-mono` text that keeps its spaces and line breaks, with `--spacing-md` by `--spacing-lg` padding. |

### Terminal marks

A terminal body keeps spaces and wraps long lines, so a transcript reads on a
phone. Inside it, these classes paint a session the way a terminal program
does:

| Class | Paints |
| --- | --- |
| `.terminal-dim` | Secondary text in `--color-muted-foreground`. |
| `.terminal-strong` | A value in `--color-foreground`, semibold. |
| `.terminal-badge` | The program's name on `--color-link`. A `.terminal-tag` right after it, such as the version, sits on `--color-muted`. |
| `.terminal-rule` | A heading followed by a `--color-border` line to the end of the row. |
| `.terminal-done` | A full-width result bar on `--color-success`. |
| `.terminal-cursor` | A blinking block cursor in `--color-link`. It holds still with reduced motion. |

## Sizes

The bar is `--size-control-sm` high, `--font-mono` at `--type-size-metadata`,
with a `--color-border` line below. The dots are 10px circles in
`--color-border-strong`. The body scrolls sideways when its content is wider
than the frame. The caption uses `--type-size-metadata`, centered.

## States

None. The body keeps the states of what it holds.

## Accessibility

The root is a `figure`; the caption, when set, is its `figcaption`. The dots
are hidden from assistive technology. A terminal transcript is text: a
screen reader reads it, so keep it short and real. A scrolling body is
reachable by keyboard when it holds focusable content.

### Keyboard

No keymap.

## When to use

- A picture of a terminal session or a screen on a site page.

## When NOT to use

- A real application window or a dialog. Use [Dialog](modal-dialog.md).
- Code a reader copies. Use [CodeBlock](code-block.md).

## Radix/shadcn mapping

No Radix or shadcn primitive. The frame is Kiso's [Card](card.md).
