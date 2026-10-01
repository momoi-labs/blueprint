# FormField

## Purpose

FormField is the standard composition for one labeled form control. It aligns
identification, entry, guidance, and field-level feedback so their visual and
accessible relationships remain intact. FormField is not a primitive and does
not replace the semantics of its children.

Use [Form](form.md) and [FormActions](form-actions.md) for the whole form and
its submission actions. FormField remains responsible for one control.

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

In React, omit `children` to render the default Input. Pass one control as
`children` to use a Textarea, Select trigger, or product-specific control.
FormField gives that control its `id`, `aria-describedby`, and
`aria-invalid` props. The control must forward them to its interactive DOM
element.

```tsx
<FormField
  id="compose"
  label="Compose file"
  hint="Docker Compose YAML."
  error={errors.compose}
>
  <Textarea rows={12} />
</FormField>
```

`hint` and `error` accept React content. FormField renders the error as a
ValidationMessage and points the control at every supplied description. Use
`fieldClassName` when the field wrapper needs a layout class; `className`
continues to style the default Input.

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

### Inline labels and adornments

`layout="inline"` places the label and control in one frame. Omit it, or use
`layout="stacked"`, to keep the existing label above the control. `leading`
accepts a decorative icon; `suffix` accepts non-interactive content such as a
unit. Both also work with the stacked layout. The suffix has an ID and joins
`aria-describedby`, preserving the child's descriptions, hint and error.

```tsx
<FormField label="RAM" layout="inline" suffix="GB" controlSize="lg"
  type="number" min={1} value={ram} onChange={changeRam} />
<Select value={os} onValueChange={setOs}>
  <FormField label="OS" layout="inline" controlSize="lg">
    <SelectTrigger><SelectValue /></SelectTrigger>
  </FormField>
  <SelectContent>{options}</SelectContent>
</Select>
```

Use a single Input or SelectTrigger in a framed group. Keep hints and errors
below its frame. Leading icons are decorative, never a substitute for the
visible Label. Do not place actions inside leading or suffix slots. Put
`disabled` and `required` on a supplied child or its Select root as usual.

The group owns its border and focus ring; the native or Radix control retains
input, selection, focus and disabled behavior. The frame reflects the actual
control's invalid and disabled states. Labels still target the control.

## Sizes

- **Small** — inherits the small size of its control and compact semantic gaps.
- **Medium** — default.
- **Large** — inherits the large control size where that control supports it.

`controlSize="sm" | "md" | "lg"` aligns the frame and control. When omitted,
a supplied child's controlSize is used; otherwise the medium size remains.
An explicit FormField size overrides the child's visual size without changing
its native `size` attribute. Custom controls must forward `data-control-size`
along with the existing ID and ARIA props. CSS-only groups use `.field-control`
inside `.field`, with `data-control-size` on the field and control.

FormField does not scale text independently. Label uses the five
property-qualified label typography tokens; supporting text uses the five
property-qualified metadata typography tokens. Use `--spacing-xs` between a
control and supporting text and `--spacing-sm` between the label and control.

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

FormField consumes `--spacing-xs`, `--spacing-sm`, and the label and metadata
typography properties named above for layout. Its
children own colors: foreground/muted text, surface/border, focus, disabled,
and danger. The composition introduces no primitive token or raw value.

## Radix/shadcn mapping

There is no single Radix FormField primitive. The composition uses Radix Label
and the relevant Radix control when one exists. It maps behaviorally to the
[shadcn/ui Field](https://ui.shadcn.com/docs/components/field) composition and
the form patterns documented by shadcn, while Kiso's explicit contract remains
Label + Input + HelperText + ValidationMessage with deterministic IDs and ARIA
wiring.
