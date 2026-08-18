# Textarea

## Purpose

Textarea collects multi-line free-form text. It is for content whose line
breaks or length make a single-line Input inappropriate.

## Anatomy

1. **Native textarea** — editable multi-line value.
2. **Resize affordance (optional)** — browser-provided, usually vertical only.
3. **Character count (optional)** — supporting status when a meaningful limit
   exists; it does not replace validation.
4. **Loading affordance (optional)** — Spinner that does not cover the value.

Label, HelperText, and ValidationMessage are composed by FormField.

## Variants

- **Default** — multi-line entry with a useful initial row count.
- **Auto-growing** — expands to content up to a documented maximum, without
  causing uncontrolled page jumps.
- **Fixed-height** — scrolls internally when layout stability is essential.
- **Read-only** — focusable and selectable, but not editable.

## Sizes

- **Small** — compact notes with a small expected amount of text.
- **Medium** — default.
- **Large** — longer authored content.

Size controls minimum block size and padding through semantic tokens. Authors
may set a content-driven `rows` value; do not encode raw dimensions in the
component contract.

## States

| State | Behavior |
| --- | --- |
| Default | Surface, text, border, and placeholder use their semantic color roles. |
| Hover | Border emphasis may increase without moving content. |
| Focus | Visible `--color-focus` ring around the whole control. |
| Active | Native editing, selection, scrolling, and resize behavior. |
| Disabled | Native `disabled`; unavailable and uses `--color-disabled`. |
| Loading | Value remains legible; shows status and avoids resize/layout shifts. |
| Error | `aria-invalid="true"`, `--color-danger` treatment, and linked ValidationMessage. |

Loading communicates ongoing work; disabled communicates unavailability. Use
both only when the control truly cannot accept edits during that work, and keep
the loading status independently perceivable.

## Accessibility

- Associate Label using matching `for` and `id`.
- Use native `textarea` behavior and appropriate `name`, `autocomplete`,
  `required`, `minlength`, and `maxlength` attributes.
- Link HelperText, character-count guidance, and ValidationMessage with
  `aria-describedby`; add `aria-invalid` only for an invalid value.
- Announce a changing character count only near a limit and without noisy
  updates on every keystroke.
- Preserve standard keyboard editing, selection, undo, paste, scrolling, and
  platform shortcuts. `Enter` inserts a line break; do not submit implicitly.

## When to use

- For descriptions, notes, queries, or other multi-line text.
- When line breaks are meaningful or expected.
- In FormField when contextual help or validation is present.

## When NOT to use

- Do not use for a single short value; use Input.
- Do not use as a code editor when syntax, line numbers, or editor commands are
  required; that needs a specialized component.
- Do not prevent paste or ordinary keyboard editing.
- Do not use placeholder text as the only label or instruction.

## Tokens

Use the same semantic control tokens as Input: surface, foreground, subtle
foreground, border, focus, disabled, and danger, plus semantic typography,
spacing, radius, shadow, and motion tokens. No primitive colors or raw values.

## Radix/shadcn mapping

Maps to [shadcn/ui Textarea](https://ui.shadcn.com/docs/components/textarea),
which styles native `textarea`. Radix has no Textarea primitive; Kiso preserves
the native element's interaction and accessibility model.
