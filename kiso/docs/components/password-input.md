# PasswordInput

Collects a secret, such as a password or API key, masked by default with a
Show/Hide action that reveals it on request. It does not set a credential
policy, validate strength or submit anything.

## Anatomy and API

1. **Native input** — `type="password"` while masked, `type="text"` while
   revealed. It keeps the same element, value, selection and focus.
2. **Reveal Button** — a ghost Button inside the same frame as the input.
3. **Status** — a visually hidden polite live region that announces the
   change.

`PasswordInput` accepts Input props except `type`. Place it inside
[FormField](form-field.md), which supplies the Label, hint, error and ID
wiring.

```tsx
<FormField label="Password" error={errors.password}>
  <PasswordInput name="password" value={password} onChange={changePassword} />
</FormField>

<FormField label="API key" hint="Paste the key for this server.">
  <PasswordInput name="api_key" autoComplete="current-password" labels={{
    showName: "Show API key", hideName: "Hide API key",
    shown: "Your API key is visible", hidden: "Your API key is hidden",
  }} />
</FormField>
```

`labels` overrides the visible action text (`show`, `hide`), its accessible
names (`showName`, `hideName`) and the announcements (`shown`, `hidden`). The
accessible name starts with the visible text. Name the secret specifically;
do not call an API key a password.

## Native attributes

Defaults are `autoComplete="current-password"`, `autoCapitalize="none"`,
`autoCorrect="off"` and `spellCheck={false}`. The last three keep a revealed
value from being changed or sent to a spellchecker. Use
`autoComplete="new-password"` when creating or changing a password. Pass
`name`, `required`, `readOnly`, `disabled` and `ref` as on Input.

Paste and password managers remain available. Do not block paste or limit
length below what a password manager generates.

## Sizes

Inside FormField, `controlSize` and the frame follow the field, as for a
grouped Input. Revealing the value does not change its font size or the
control's width. The Button reserves the width of its longer label.

## States

| State | Behavior |
| --- | --- |
| Masked | Default. The value is obscured and the Button reads Show. |
| Revealed | The value uses the monospace family at the same size, so similar characters are distinguishable. The Button reads Hide. |
| Submitted | Submitting the containing form masks the value again. The value stays in the field. |
| Read-only | The value cannot change; reveal still works. Use it while a submission is pending. |
| Disabled | Both the input and the Button are disabled. |
| Invalid | FormField's error sets `aria-invalid` and colors the frame. |

## Accessibility

- The Button is a separate tab stop after the input. Enter and Space toggle
  it without submitting the form.
- Toggling keeps focus on the Button. The value, caret and selection persist.
- The Button's name changes between Show and Hide, and the live region
  announces the new state. It does not use `aria-pressed`, because its name
  already changes.
- The Button points at the input with `aria-controls`.
- Edge's built-in reveal control is hidden so only one action is offered.

This follows the [GOV.UK password input](https://design-system.service.gov.uk/components/password-input/)
and [WCAG 2.2 accessible authentication](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html),
which treats paste and password managers as assistance.

## When to use

- Passwords, passphrases, API keys and other secrets a person enters or
  pastes.

## When NOT to use

- One-time codes; use Input with `autoComplete="one-time-code"` and
  `inputMode="numeric"`.
- Showing a generated secret once; use read-only, copyable text.
- Values that are not secret.

## Tokens

The frame uses FormField's grouped control: `--color-card`, `--color-input`,
`--color-border-strong`, `--color-focus`, `--color-danger`,
`--color-disabled-surface` and `--color-disabled`. The revealed value uses
`--font-mono`. Spacing uses `--spacing-xs`, `--spacing-sm` and `--spacing-md`.
The Button keeps its ghost variant tokens.

## Radix/shadcn mapping

Radix and shadcn/ui have no password input. This composes the native input
and Kiso's Button.
