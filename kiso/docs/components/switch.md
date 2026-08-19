# Switch

## Purpose

Switch changes one boolean setting between on and off. The change normally
takes effect immediately, like a physical switch, rather than waiting for form
submission.

## Anatomy

1. **Root/track** — focusable control and on/off state owner.
2. **Thumb** — moves to make state visible; motion is supportive, not the only
   signal.
3. **Label** — names the setting, not the action (for example, “Query logging,”
   not “Enable query logging”).
4. **Description (optional)** — explains effect or scope.

## Variants

- **Off / on** — the two stable setting values.
- **With description** — for settings whose effect is not obvious from Label.
- **Controlled** — application owns state, including persistence and rollback.
- **Uncontrolled** — primitive owns initial state; use only when persistence and
  external synchronization are unnecessary.

Switch is one immediate boolean setting. Checkbox is an independent form choice
or member of a multi-select list; Select chooses one value from many.

## Sizes

- **Small** — dense settings tables, with a full-sized Label target.
- **Medium** — default.

Track, thumb, and gap scale as a unit with semantic tokens. Do not encode state
only through thumb position or color; the accessible state remains required.

## States

| State | Behavior |
| --- | --- |
| Default | Clearly presents off or on state. |
| Hover | Track/label pair receives quiet interactive emphasis. |
| Focus | Root has a visible `--color-focus` ring. |
| Active | Brief pressed feedback; thumb movement uses `--motion-duration-fast` and `--motion-easing-standard`. |
| Disabled | Cannot toggle and uses `--color-disabled`. |
| Loading | Retains the intended or confirmed state, shows pending status, and prevents duplicate changes only when necessary. |
| Error | Persistence failure is explained with `--color-danger` feedback and a recovery action; do not leave the displayed state ambiguous. |

Loading differs from disabled: it communicates an in-progress state change.
If the request fails, either revert to the confirmed state or retain the choice
with an explicit retry path.

## Accessibility

- Radix supplies `role="switch"` and `aria-checked`; preserve these semantics.
- Associate Label using matching `for`/`id` or a single, unambiguous
  `aria-labelledby` relationship.
- Expose disabled and busy status. Link description or failure feedback via
  `aria-describedby`.
- Keyboard: `Tab` focuses; `Space` toggles. `Enter` may toggle where the
  primitive/browser contract supports it consistently. Do not require drag.
- State must be announced as on/off and remain discernible without color or
  animation. Honor reduced-motion tokens.

## When to use

- For a single preference that applies immediately.
- In settings surfaces where current on/off state must remain visible.
- When toggling does not require a separate Save action.

## When NOT to use

- Do not use for a value submitted only with the rest of a form; use Checkbox.
- Do not use for multiple related selections; use a Checkbox group.
- Do not use for choosing among three or more values; use Select.
- Do not use when changing state has a destructive or complex consequence that
  needs explicit confirmation; use a clearly named action flow.

## Tokens

Use `--color-border`, `--color-surface`, `--color-foreground`,
`--color-primary`, `--color-focus`, `--color-disabled`, and `--color-danger`,
plus `--spacing-sm` label gap, `--radius-full`, the five property-qualified
label typography tokens, `--motion-duration-fast`, and
`--motion-easing-standard`.

## Radix/shadcn mapping

Maps to [Radix Switch](https://www.radix-ui.com/primitives/docs/components/switch)
and [shadcn/ui Switch](https://ui.shadcn.com/docs/components/switch). Keep
Radix's switch role, checked state, form behavior, and keyboard interaction as
the behavioral reference.
