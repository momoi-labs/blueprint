# Label

## Purpose

Label names a form control. It tells a person what value to provide and gives
the control its accessible name. Every visible form control has a persistent,
specific label; placeholder text is never a substitute.

## Anatomy

1. **Label text** — short, direct name for the value.
2. **Required indicator (optional)** — textual or otherwise exposed to
   assistive technology; color alone is insufficient.
3. **Supplementary text (optional)** — a compact qualifier such as “Optional.”

The label and control are associated with matching `for` and `id` values. A
control wrapped by a label is valid HTML, but explicit association is the Kiso
default because it remains clear across composed layouts.

## Variants

- **Default** — names one editable control.
- **Required** — identifies a required value. Prefer marking the smaller set:
  if most fields are required, mark optional fields instead.
- **Optional** — appends a quiet “Optional” qualifier when that distinction is
  useful.
- **Group label** — use `legend` inside `fieldset`, not Label, for a related set
  of Checkbox controls.

## Sizes

Label follows the associated control size rather than exposing an independent
size API. Use all five property-qualified label typography tokens. Keep the
label-to-control gap at `--spacing-sm`.

## States

| State | Behavior |
| --- | --- |
| Default | Uses `--color-foreground`. |
| Hover | No independent hover treatment; clicking focuses or activates the associated control. |
| Focus | The control owns the visible focus indicator. |
| Active | No independent active treatment. |
| Disabled | Uses `--color-disabled` and matches the control's disabled semantics. |
| Loading | Remains readable while the control is loading. |
| Error | Remains readable; error meaning belongs to ValidationMessage and the control state, not color on the label alone. |

## Accessibility

- Set `for` to the exact `id` of the associated control.
- Do not hide the only accessible name. A visually hidden label is acceptable
  only when the visual context is unambiguous and the text remains available
  to assistive technology.
- Required controls use native `required` when appropriate or
  `aria-required="true"`; the visible indicator must also be explained.
- Clicking or tapping Label moves focus to text controls and toggles Checkbox
  or Switch through their native/Radix behavior.
- Label adds no keyboard interaction of its own.

## When to use

- To name Input, Textarea, Select, Checkbox, or Switch.
- As the Label part of FormField.
- When a visible prompt must remain available after a value is entered.

## When NOT to use

- Do not use placeholder text as a label.
- Do not use Label as a section heading or explanatory paragraph.
- Do not use one Label for a group of controls; use `fieldset` and `legend`.
- Do not place instructions or errors in Label; use HelperText and
  ValidationMessage.

## Tokens

Use `--color-foreground` for label text, `--color-muted-foreground` for an
optional qualifier, `--color-disabled` for disabled text;
`--type-role-label-font-family`, `--type-role-label-font-size`,
`--type-role-label-font-weight`, `--type-role-label-letter-spacing`, and
`--type-role-label-line-height`; and `--spacing-sm`. Do not use primitive colors
or raw values.

## Radix/shadcn mapping

Maps to [Radix Label](https://www.radix-ui.com/primitives/docs/components/label)
and [shadcn/ui Label](https://ui.shadcn.com/docs/components/label). Preserve
Radix Label's control association and prevention of accidental text selection;
the Kiso contract additionally requires explicit `for`/`id` association.
