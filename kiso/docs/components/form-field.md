# FormField

## Purpose

FormField is the standard composition for one labeled form control. It aligns
identification, entry, guidance, and field-level feedback so their visual and
accessible relationships remain intact. FormField is not a primitive and does
not replace the semantics of its children.

## Anatomy

The canonical composition is:

1. **Label** — required; names the control through matching `for`/`id`.
2. **Input** — the default control in this composition. Textarea, Select,
   Checkbox, or Switch may occupy the control slot when appropriate.
3. **HelperText** — optional; provides persistent context, format, or scope.
4. **ValidationMessage** — optional until invalid; explains a field-level error
   and recovery.

For the issue's foundational chain, read this literally as **Label + Input +
HelperText + ValidationMessage**. FormField owns layout and ID wiring; each
child retains its own behavior.

```text
Label
Input
HelperText
ValidationMessage
```

## Variants

- **Standard** — Label above Input, supporting text below.
- **Required** — control exposes required semantics and the visible convention
  is consistent across the form.
- **Optional** — Label carries an “Optional” qualifier when useful.
- **Horizontal** — Label and control columns for wide, dense settings pages;
  collapses without changing reading order.
- **Control substitution** — replaces Input with another Kiso form primitive
  while preserving Label and description/error wiring.

## Sizes

- **Small** — inherits the small size of its control and compact semantic gaps.
- **Medium** — default.
- **Large** — inherits the large control size where that control supports it.

FormField does not scale text independently. Label and supporting text use
their semantic typography roles; gaps use spacing tokens.

## States

| State | Behavior |
| --- | --- |
| Default | Label, control, and optional HelperText form one readable group. |
| Hover | Delegated to the interactive control; layout does not change. |
| Focus | Control owns the visible focus ring; supporting content remains stable. |
| Active | Delegated to the control. |
| Disabled | Control is disabled; Label and supporting text communicate unavailability without hiding context. |
| Loading | Control exposes busy status and loading affordance while Label/help remain readable. |
| Error | Control has `aria-invalid="true"`; ValidationMessage appears without removing useful HelperText. |

Disabled and loading remain distinct at composition level. Loading is a live
process; disabled is unavailable. Showing ValidationMessage must not cause the
control, Label, or existing help to lose their associations.

## Accessibility

- Generate stable, collision-free IDs. Label `for` points to the control `id`.
- HelperText and ValidationMessage each have an ID. The control's
  `aria-describedby` contains the IDs of every present description, separated
  by spaces; preserve HelperText when an error appears if it is still useful.
- Invalid controls set `aria-invalid="true"`. ValidationMessage may use a live
  region for errors introduced after interaction, but avoid duplicate
  announcements caused by simultaneous alert and description behavior.
- Required, disabled, read-only, and busy semantics belong on the control.
- DOM reading order follows Label → control → HelperText → ValidationMessage,
  even in a horizontal visual layout.
- FormField adds no keyboard interaction. The contained control keeps its native
  or Radix keyboard contract, and clicking Label targets that control.

## When to use

- For nearly every standalone labeled form control.
- To make accessible ID wiring and vertical rhythm consistent.
- When a control needs help, validation, required/optional status, or all three.

## When NOT to use

- Do not use as a generic layout wrapper or fieldset for unrelated controls.
- Do not duplicate a Label or description already supplied by a composite
  control.
- Do not render an empty ValidationMessage merely to reserve space unless the
  product has measured layout-stability needs.
- Do not put form-level or page-level errors here; ValidationMessage is
  field-level feedback.

## Tokens

FormField consumes semantic spacing and typography tokens for layout. Its
children own colors: foreground/muted text, surface/border, focus, disabled,
and danger. The composition introduces no primitive token or raw value.

## Radix/shadcn mapping

There is no single Radix FormField primitive. The composition uses Radix Label
and the relevant Radix control when one exists. It maps behaviorally to the
[shadcn/ui Field](https://ui.shadcn.com/docs/components/field) composition and
the form patterns documented by shadcn, while Kiso's explicit contract remains
Label + Input + HelperText + ValidationMessage with deterministic IDs and ARIA
wiring.
