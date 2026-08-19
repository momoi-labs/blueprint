# Checkbox

## Purpose

Checkbox represents an independent boolean choice or membership in a list of
multiple choices. More than one checkbox in a group may be selected.

## Anatomy

1. **Root** — focusable checkbox control and checked-state owner.
2. **Indicator** — check mark or indeterminate mark.
3. **Label** — names the choice and enlarges the activation target.
4. **Description (optional)** — HelperText for consequences or context.

## Variants

- **Unchecked / checked** — independent false/true choice.
- **Indeterminate** — summarizes mixed child selections; it is a visual and
  programmatic third presentation, not a submitted business value by itself.
- **Checkbox group** — multiple related values within `fieldset` and `legend`.
- **Required acknowledgment** — use sparingly for a genuinely required consent;
  validation must explain what is needed.

Checkbox is for independent or multiple selections. Switch is for one setting
that takes effect as on/off; Select is for exactly one value from many.

## Sizes

- **Small** — dense data and compact lists while retaining an adequate combined
  Label activation target.
- **Medium** — default.

Indicator follows `--type-role-label-font-size`; its label gap is
`--spacing-sm`. Avoid a
large decorative variant; hierarchy belongs in the text and layout.

## States

| State | Behavior |
| --- | --- |
| Default | Unchecked outline uses `--color-border`; checked state uses the semantic primary treatment. |
| Hover | Root/label pair shows subtle interactive emphasis. |
| Focus | Visible `--color-focus` ring on the root. |
| Active | Pressed feedback is brief and does not obscure the checked value. |
| Disabled | Cannot toggle, uses `--color-disabled`, and the Label reflects disabled state. |
| Loading | Rare; keep the current value visible and announce pending persistence instead of replacing the indicator. |
| Error | Group or control is invalid, uses `--color-danger`, and references ValidationMessage. |

Loading does not mean unchecked or disabled. For optimistic updates, retain the
new checked value and expose pending status; on failure, restore or explain the
actual value with a recovery action.

## Accessibility

- Radix supplies `role="checkbox"`, checked/indeterminate state, and hidden
  native form participation. Preserve those semantics.
- Associate Label with the root ID. A group uses `fieldset`/`legend` or an
  equivalent named group.
- Use `aria-checked="mixed"` for indeterminate state where not supplied by the
  primitive. Expose required, invalid, disabled, and busy states.
- Link HelperText and ValidationMessage through `aria-describedby`.
- Keyboard: `Tab` focuses each enabled checkbox; `Space` toggles it. Do not add
  arrow-key exclusivity—that belongs to radio-group behavior.

## When to use

- For independent opt-in/opt-out choices submitted with a form.
- For selecting zero, one, or many items from a visible list.
- For a parent “select all” control with a mixed state.

## When NOT to use

- Do not use for an immediate single on/off setting; use Switch.
- Do not use for exactly one mutually exclusive choice from many; use Select
  (or a future RadioGroup).
- Do not make the check mark the only indication of a consequential choice;
  provide a clear Label and context.

## Tokens

Use `--color-border`, `--color-surface`, `--color-foreground`,
`--color-primary`, `--color-focus`, `--color-disabled`, and `--color-danger`,
plus `--spacing-sm`, `--radius-sm`, the five property-qualified label
typography tokens, `--motion-duration-fast`, and `--motion-easing-standard`.

## Radix/shadcn mapping

Maps to [Radix Checkbox](https://www.radix-ui.com/primitives/docs/components/checkbox)
and [shadcn/ui Checkbox](https://ui.shadcn.com/docs/components/checkbox).
Preserve Radix's controlled/uncontrolled and indeterminate behavior, keyboard
contract, and form participation.
