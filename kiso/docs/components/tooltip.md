# Tooltip

A short, non-essential hint on hover or keyboard focus. Progressive
enhancement only.

## Purpose

Tooltip clarifies a control the person can already use: the accessible name
of an [IconButton](icon-button.md), a keyboard shortcut, an abbreviated
column header. If the person cannot succeed without the Tooltip, the UI is
wrong — put the information on the screen.

User story #10: **do not use Tooltip on touch**, and **never put essential
information in a Tooltip**.

Tooltip is not [Alert](alert.md), not field help (HelperText), and not a
rich overlay (Popover, later slice).

## Anatomy

```
Tooltip.Provider   (once per app)
└── Tooltip
    ├── Trigger (the existing control: usually IconButton, sometimes a
    │   truncated string)
    └── Content (short text; optional keyboard hint)
        └── Arrow (optional; skip if it adds noise)
```

- **Trigger.** Almost always an existing control that already has a name.
  Tooltip does not *become* the name.
- **Content.** A few words that match or slightly expand the name. Optional
  shortcut, written as the keys themselves ("⌘K"), not as a sentence.
- **Arrow.** Optional. Prefer none; alignment and `--spacing-xs` offset are
  enough.

## Variants

One variant. No color-coded "error tooltips". Errors are ValidationMessage
or Alert, and they are essential — they cannot live in a Tooltip.

| Treatment | Tokens |
| --- | --- |
| Default | Background `--color-elevated-surface`, text `--color-foreground`, border `--color-border`, radius `--radius-sm`, padding `--spacing-xs` `--spacing-sm`, all five property-qualified metadata typography tokens, shadow `--shadow-sm`. |

Keyboard shortcut inside Content uses `--type-role-code-font-family`,
`--type-role-code-font-size`, `--type-role-code-font-weight`,
`--type-role-code-letter-spacing`, and `--type-role-code-line-height`.

Placement: `top` by default, flip on collision (`side` + `align` from the
Radix reference). Offset `--spacing-xs` from the trigger. Do not specify
the offset in raw pixels.

## Sizes

One size: `--type-role-metadata-font-family`, `--type-role-metadata-font-size`,
`--type-role-metadata-font-weight`, `--type-role-metadata-letter-spacing`, and
`--type-role-metadata-line-height`. Content wraps; max width is a reading
measure of a short phrase (about three or four words per line, a couple of
lines). If you need a paragraph, you need HelperText, Alert, or Popover.

## States

| State | Behavior |
| --- | --- |
| closed (default) | Content not shown. Trigger is usable. |
| delayed-open | Pointer hover still; waiting the delay. |
| open | Content visible. |
| hover (trigger) | Starts the open delay. |
| focus (trigger) | Opens without the pointer delay (keyboard). |
| active (trigger) | Activation **closes** the Tooltip and runs the control. |
| disabled trigger | Native disabled controls do not hover. If a disabled [Button](button.md) must explain *why*, that explanation is adjacent copy or HelperText — **not** a Tooltip on a wrapper span. Disabled-why is essential, so Tooltip is the wrong place. |
| loading | N/A for Tooltip itself. |
| error | N/A. |

**Touch / coarse pointer:** do not open. `pointer: coarse` (and the absence
of hover) means the Content never appears. The trigger must remain fully
usable. This is a hard rule, not a nice-to-have.

**Delay:** follow the Radix Provider default (open delay, skip-delay when
moving between triggers). Do not open instantly on pointer hover — that
flickers. Keyboard focus opens without the pointer delay.

Motion: fade/scale with `--motion-duration-fast` and
`--motion-easing-standard`. Reduced motion: show and hide with no travel.

## Accessibility

- Content has `role="tooltip"` and is referenced from the trigger with
  `aria-describedby` when open (Radix does this).
- The trigger's **accessible name** stays on the trigger (`aria-label` on
  IconButton, visible text on Button). Tooltip is a description, not a
  name. If the Tooltip text *is* the name, it must duplicate `aria-label`,
  not replace it.
- Content is plain text. No Buttons, no Links, no inputs. Interactive
  content is Popover.
- Do not set `aria-hidden` on Content while it is shown.
- Never the only path to a label, an error, a shortcut that is required,
  or a destructive-consequence warning.
- Touch: because Content does not open, anything that was only in the
  Tooltip is unavailable — another reason it cannot be essential.

### Keyboard

From Radix Tooltip:

| Key | Action |
| --- | --- |
| `Tab` | Focus on the trigger opens the Tooltip without delay; focus away closes it. |
| `Escape` | Closes without delay. |
| `Enter` / `Space` | Activate the trigger; Tooltip closes. |

There is no Tooltip-specific tab stop. Content is not focused.

## When to use

- Repeating an IconButton's `aria-label` for pointer users.
- Showing a keyboard shortcut next to a named control.
- Expanding a truncated string (filename, query) where the full value is
  also available by expanding the row or focusing a cell — the Tooltip is a
  shortcut to read it, not the only copy.

## When NOT to use

- **Touch as a primary environment for that control.** If the product's
  use of the control is touch-first, put a visible label on the screen.
- **Essential information.** Errors, permissions, destructive consequences,
  how to complete the task. User story #10.
- **Field help.** HelperText, always visible or available next to the
  field.
- **In-page conditions.** [Alert](alert.md).
- **Rich or interactive content.** Popover (overlay slice).
- **Disabled-button explanations.** Visible copy; see States.
- **A substitute for `aria-label`.** IconButton already requires a name.
- **Delaying first-time discovery of a primary action.** If people need a
  Tooltip to find "Save", the label is missing.

## Radix/shadcn mapping

This is the component with a real Radix primitive. Implement against it.

| Kiso | Reference |
| --- | --- |
| Behavior, delay, keyboard, `role="tooltip"` | Radix [Tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip) (`Provider`, `Root`, `Trigger`, `Portal`, `Content`) |
| Styling conventions | shadcn [Tooltip](https://ui.shadcn.com/docs/components/tooltip) restyled to the tokens above |

Provider wraps the app once. Do not nest Providers per control.

shadcn's "Disabled Button" example wraps a disabled Button in a span to
force a Tooltip. **Do not use that pattern in Kiso.** A disabled-why
message is essential and must be visible without hover.

shadcn (and newer Base UI ports) may differ in API names (`TooltipTrigger`,
`TooltipContent`). Map parts 1:1 to Radix anatomy; keep Radix keyboard and
delay behavior as the behavioral source of truth.

Skip the arrow if the shadcn default includes one and it adds decoration
without helping placement.

On coarse pointers, do not mount/open Content. Radix will still open on
long-press in some browsers — suppress that. Long-press is not a Tooltip
affordance in Kiso; it is a platform selection gesture.
