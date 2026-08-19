# ValidationMessage

## Purpose

ValidationMessage explains a field-level error and tells the person how to
recover. It is specific to one control or control group; broader failures
belong in a form-level summary or Alert.

## Anatomy

1. **Message** — what is invalid, why when known, and what to do next.
2. **Identifier** — stable ID referenced by the invalid control through
   `aria-describedby`.
3. **Error indicator (optional)** — decorative icon that never replaces text.
4. **Recovery action (optional)** — only when the next step cannot be expressed
   as corrected input alone.

## Variants

- **Constraint** — missing, malformed, too short/long, or out of range.
- **Server validation** — value conflicts with authoritative server state.
- **Group validation** — applies to a named related group and is referenced by
  that group's controls or container as appropriate.
- **With recovery action** — provides Retry or another concrete action after a
  field-scoped asynchronous failure.

Copy follows Kiso's hard error structure: what happened; why, when known; what
the person can do now. Avoid blame, codes without context, and dead ends.

## Sizes

ValidationMessage uses `--type-role-metadata-font-size` and
`--type-role-metadata-line-height`. It wraps to the FormField width and uses
`--spacing-xs` from the control. An optional icon
aligns with the first line and does not create a separate size variant.

## States

| State | Behavior |
| --- | --- |
| Default | Hidden when the field is valid or has not reached the product's validation threshold. |
| Hover | No independent state; an embedded recovery action has its own. |
| Focus | No independent state; focus normally remains on or returns to the invalid control. |
| Active | No independent state. |
| Disabled | Remove stale errors if the field is no longer applicable; otherwise preserve the explanation of unavailable invalid data. |
| Loading | Do not show a speculative error while validation is pending; expose pending status separately. |
| Error | Visible using `--color-danger`, linked to an `aria-invalid="true"` control. |

ValidationMessage represents error, not loading. When asynchronous validation
starts, retain the last confirmed result or communicate validation progress;
do not flash an error before the result exists.

## Accessibility

- Give the message a stable ID and include it in the invalid control's
  `aria-describedby`, alongside HelperText when present.
- Set `aria-invalid="true"` on the invalid control, not on the message.
- For a newly introduced error, use a deliberate live-region strategy or move
  focus to an error summary on submission. Avoid combining mechanisms that
  announce the same text twice.
- On failed submission, focus the first invalid control or an error summary
  that links to it. Do not move focus on every keystroke.
- Color and icon are supplementary; understandable text is mandatory.
- Embedded recovery actions use native keyboard interaction and clear names.

## When to use

- For actionable validation feedback tied to one field.
- After validation at the product's chosen moment: blur, submit, or an
  appropriately debounced server response.
- In FormField below HelperText when both remain useful.

## When NOT to use

- Do not use for neutral advice; use HelperText.
- Do not use for page-, form-, or system-level failure; use the appropriate
  summary or Alert.
- Do not show an error before the person has had a reasonable chance to enter a
  value.
- Do not write only “Invalid value”; state the constraint and recovery.

## Tokens

Use `--color-danger` for error text and error affordances;
`--type-role-metadata-font-family`, `--type-role-metadata-font-size`,
`--type-role-metadata-font-weight`, `--type-role-metadata-letter-spacing`, and
`--type-role-metadata-line-height`; and `--spacing-xs`. Surfaces and focus indicators retain
their own semantic roles. Do not use a primitive status color or raw value.

## Radix/shadcn mapping

Radix has no standalone ValidationMessage primitive. It maps to field-error or
form-message behavior in [shadcn/ui Field](https://ui.shadcn.com/docs/components/field)
and related form composition. Kiso additionally requires explicit
`aria-describedby` linkage, `aria-invalid` on the control, and actionable error
copy.
