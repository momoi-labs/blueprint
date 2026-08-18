# Input

## Purpose

Input collects a single-line text-like value such as a name, email address,
search term, URL, number, or password. Use the native input type that best
describes the value so browsers and assistive technology can provide the right
behavior.

## Anatomy

1. **Native input** — the editable value and browser semantics.
2. **Leading affordance (optional)** — contextual icon or fixed prefix; never
   the only label.
3. **Trailing affordance (optional)** — fixed suffix, clear action, or status.
4. **Loading affordance (optional)** — Spinner adjacent to the value without
   replacing it or changing the field width.

Label, HelperText, and ValidationMessage belong to FormField rather than the
Input root.

## Variants

- **Text** — general single-line entry.
- **Email, URL, telephone, number** — uses the corresponding native `type` and
  appropriate `inputmode`; client validation does not replace server validation.
- **Password** — obscures the value; an optional show/hide action has an
  accessible name and preserves focus.
- **Search** — use `type="search"` for a query field. Search behavior is defined
  by the later Search component, not by Input alone.
- **Read-only** — value can be focused, selected, and copied but not edited.

## Sizes

- **Small** — compact toolbars and dense technical forms.
- **Medium** — default for most forms.
- **Large** — rare, high-emphasis entry points.

Size changes height and internal spacing through semantic size and spacing
tokens. It does not reduce text or target size below accessible product norms.

## States

| State | Behavior |
| --- | --- |
| Default | `--color-surface` background, `--color-border` outline, `--color-foreground` value; placeholder uses `--color-subtle-foreground`. |
| Hover | Border emphasis may increase without changing layout or implying focus. |
| Focus | Visible `--color-focus` ring; do not rely on border color alone. |
| Active | Native text selection and editing behavior; no separate persistent visual state. |
| Disabled | Native `disabled`; not focusable or submitted, uses `--color-disabled`. |
| Loading | Remains readable and normally focusable; shows a Spinner, exposes busy status, and prevents conflicting submission-side edits only when necessary. |
| Error | Uses `aria-invalid="true"`, visible danger treatment with `--color-danger`, and a linked ValidationMessage. |

Disabled and loading are not interchangeable. Disabled means the field is
unavailable. Loading means work is in progress and must be communicated; do not
silently disable a field merely to show activity.

## Accessibility

- Associate a visible Label through matching `for` and `id`.
- Use the correct `type`, `name`, `autocomplete`, `inputmode`, `required`,
  `min`, `max`, and other native attributes for the data.
- Link HelperText and ValidationMessage IDs through a space-separated
  `aria-describedby`. Add `aria-invalid="true"` only when invalid.
- If loading changes what the person can do, expose it with `aria-busy` on the
  field or a nearby status region. Spinner alone is not an accessible status.
- Standard text-input keyboard behavior applies. Do not override selection,
  cursor, undo, paste, or platform shortcuts. Any trailing action is separately
  keyboard reachable and named.

## When to use

- For one line of free-form or constrained text-like data.
- When native input semantics match the requested value.
- Inside FormField when a label, help, or validation feedback is needed.

## When NOT to use

- Do not use for multi-line prose; use Textarea.
- Do not use for choosing one predefined option from many; use Select.
- Do not use for a boolean setting; use Switch, or Checkbox in a list/multi-select.
- Do not put essential instructions only in placeholder text.

## Tokens

Use only semantic roles: `--color-surface`, `--color-foreground`,
`--color-subtle-foreground`, `--color-border`, `--color-focus`,
`--color-disabled`, and `--color-danger`, plus semantic typography, spacing,
radius, shadow, and motion tokens. Never use palette primitives or raw values.

## Radix/shadcn mapping

Maps to [shadcn/ui Input](https://ui.shadcn.com/docs/components/input), which
styles the native HTML `input`. Radix has no Input primitive; retain native HTML
semantics rather than introducing a custom interaction model.
