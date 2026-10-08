# Login / authentication

Pre-authenticated entry: sign-in, and the minimal adjacent flows (sign-out
landing, session expired). No product Sidebar; focus on one credential task.

User story #29.

## Purpose

Authenticate the person with a calm, single-purpose layout. Authentication is
a gate, not a product tour. After success, enter the
[application shell](application-shell.md).

## Component composition

| Region | Compose with | Role |
| --- | --- | --- |
| Page canvas | two equal columns on `--color-background`; one column on narrow screens | No Header/Sidebar product chrome |
| Context panel | `--color-muted` column, full height, half the width | Brand, optional server origin, one heading and access help. Hidden on narrow screens |
| Brand | product name / home [Link](../components/link.md) or [BrandMark](../components/brand-mark.md) | Identity only; not a marketing hero. Repeated above the form on narrow screens |
| Form surface | [Card](../components/card.md) | Contains the auth form |
| Fields | [FormField](../components/form-field.md) | Email/username [Input](../components/input.md), secret in [PasswordInput](../components/password-input.md), optional OTP Input |
| Submit | [Button](../components/button.md) | "Sign in" primary; full width of the Card content is acceptable |
| Errors | [Alert](../components/alert.md) and/or [ValidationMessage](../components/validation-message.md) | Auth, service and network failures use Alert (what / why / now); field format errors use ValidationMessage |
| Secondary nav | [Link](../components/link.md) | Forgot password, SSO, create account — text Links, not a Sidebar |
| Access help | list in the context panel; [Disclosure](../components/disclosure.md) in the form on narrow screens | Same content in both places |
| Busy | Button with [Spinner](../components/spinner.md) and `aria-busy` | Prevent double submit |

Tokens: canvas `--color-background`, context panel `--color-muted`, Card `--color-surface` / `--color-border`,
text `--color-foreground` / `--color-muted-foreground`, primary action
`--color-primary`, focus `--color-focus`. Keep flourish out of error copy
([voice-and-tone](../voice-and-tone.md)).

### Context panel

The panel answers questions about getting access: where to find or reset a
credential, who grants an account and what to do when locked out. It is not a
product tour. Product-specific instructions, such as a CLI command that prints
a key, belong to that product's login, not to this generic pattern.

### Optional background treatment

The quiet `momoi` background (`data-background-style="momoi"`,
`data-background-strength="quiet"`) may sit behind the page, with the Card
fill mixed at 65% of `--color-card` so the form stays readable. Hide the mark
under `forced-colors`. Use only existing theme tokens.

## Flow

1. Unauthenticated person hits a protected route or opens the login URL.
2. Show login Card; focus the first FormField.
3. Person submits credentials. Client checks run first; the request starts
   only when the fields are valid. Further submits are ignored while pending.
4. On success: establish session and route into the application shell (deep
   link to the originally requested path when safe).
5. On failure: show Alert with recovery (retry, reset password, contact admin);
   never a cryptic code alone. Keep the identifier. Clear the password only
   when the server refused the credentials; keep it for service and network
   failures, which are not the person's mistake.
6. Sign-out returns to this pattern (or a signed-out confirmation that Links
   back to Sign in).
7. Session expired: same layout with an Alert explaining the session ended and
   that signing in continues to the previous destination when possible.

SSO: primary Button or Link "Continue with …" above or instead of password
fields; do not hide password auth without a documented product decision.

## States

| State | Behavior |
| --- | --- |
| default | Context panel + Card + fields + Sign in. The secret is masked. |
| loading (submit) | Primary Button shows a Spinner, a specific label and `aria-busy`; inputs read-only; repeated submits ignored; no full-page Spinner that hides the form. |
| invalid fields | ValidationMessage on a missing or malformed value; focus first invalid field. |
| error (auth refused) | Alert says the credentials were not accepted and how to recover; password cleared and focused. |
| error (service) | Alert says the service could not sign the person in and to retry later; credentials kept. |
| error (network) | Alert says the service could not be reached and to check the connection; credentials kept. |
| empty | Not applicable as a collection; do not use EmptyState for "no session". |
| success | Brief transition into the shell; optional Toast is unnecessary if navigation is immediate. |

## Layout sketch

```text
┌──────────────────────────────────┬───────────────────────────────────┐
│ --color-muted                    │ --color-background                │
│                                  │                                   │
│ [N] Momoi Product                │      ┌─────────────────────────┐  │
│     app.example.com              │      │ Card: Sign in           │  │
│                                  │      │                         │  │
│ Sign in to your workspace        │      │ Alert (auth error)      │  │
│ One line about access            │      │ FormField  Email        │  │
│                                  │      │ FormField  Password     │  │
│ ──────────────────────────────── │      │   [•••••••••]  [ Show ] │  │
│ Trouble signing in?              │      │ [ Sign in ]             │  │
│ · Reset a password               │      │ Reset password          │  │
│ · Ask an admin for an invitation │      └─────────────────────────┘  │
│                                  │                                   │
└──────────────────────────────────┴───────────────────────────────────┘

Narrow screens: one column. Brand and origin above the Card; access help in a
Disclosure ("Trouble signing in?") below the form.
```

The gallery's Login example implements this composition, including each
error state.

## When to use

- Sign-in, session-expired re-auth, and post sign-out entry.
- Minimal invite-accept screens that only establish a session.

## When NOT to use

- Authenticated account preference editing — [Settings](settings.md).
- Product navigation or first-run feature tours after sign-in — use the
  [application shell](application-shell.md), not this gate.
- Permission failures inside an authenticated session — explain the blocked
  action in-product; do not reuse this login layout as a stand-in.

## Related patterns

- [Application shell](application-shell.md) — post-auth destination.
- [Settings](settings.md) — profile and security preferences after login.
