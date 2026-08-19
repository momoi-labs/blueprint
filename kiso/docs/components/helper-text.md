# HelperText

## Purpose

HelperText gives persistent, non-error context for a form control: expected
format, scope, consequence, or a concise example. It helps a person succeed
before validation fails.

## Anatomy

1. **Text** — one concise instruction or explanation.
2. **Identifier** — stable ID referenced by the control's
   `aria-describedby`.
3. **Supplementary link (optional)** — a separately named destination when
   essential documentation cannot fit in concise help.

## Variants

- **Instruction** — explains expected format or constraints.
- **Context** — explains where or how the value is used.
- **Example** — shows a representative value without becoming a default value.
- **With link** — points to deeper documentation; the sentence remains useful
  without relying on the link text alone.

HelperText is never an error. ValidationMessage owns field-level invalid
feedback.

## Sizes

HelperText has one typography size: `--type-role-metadata-font-size` with
`--type-role-metadata-line-height`. Its line length and wrapping follow the
control width. Use `--spacing-xs` between
the control, HelperText, and ValidationMessage.

## States

| State | Behavior |
| --- | --- |
| Default | Uses `--color-muted-foreground` and remains readable as normal text. |
| Hover | No state unless it contains a link; only the link responds. |
| Focus | No state unless it contains a link; the link receives its own focus ring. |
| Active | No independent state. |
| Disabled | Usually remains readable to explain why the control is unavailable; do not automatically reduce it to illegibility. |
| Loading | Remains stable unless the guidance itself has genuinely changed. |
| Error | Remains visible when still useful; ValidationMessage appears separately with danger semantics. |

## Accessibility

- Give HelperText a stable ID and include it in the associated control's
  `aria-describedby` value.
- When both help and validation exist, reference both IDs in meaningful DOM
  order. Do not overwrite one relationship with the other.
- Do not use `role="alert"`, `aria-live`, or `aria-invalid`; the text is
  descriptive, not urgent status.
- Links use descriptive text and standard keyboard behavior.
- Keep instructions concise, direct, and available before input—not only on
  hover or focus.

## When to use

- To state a format, unit, scope, consequence, or short example.
- When context reduces avoidable validation errors.
- As the supporting description in FormField.

## When NOT to use

- Do not use for an error; use ValidationMessage.
- Do not repeat the Label or placeholder.
- Do not put essential help only in a tooltip or placeholder.
- Do not add generic advice that does not change how the field is completed.

## Tokens

Use `--color-muted-foreground`; `--type-role-metadata-font-family`,
`--type-role-metadata-font-size`, `--type-role-metadata-font-weight`,
`--type-role-metadata-letter-spacing`, and `--type-role-metadata-line-height`;
and `--spacing-xs`. `--color-subtle-foreground` is not suitable
for ordinary small helper copy because it is restricted to large or
non-essential hints. No primitive colors or raw values.

## Radix/shadcn mapping

Radix has no standalone HelperText primitive. In shadcn compositions it maps
to field description/form description behavior (for example, the description
part of [shadcn/ui Field](https://ui.shadcn.com/docs/components/field)). Kiso's
required behavioral contract is the explicit `aria-describedby` relationship.
