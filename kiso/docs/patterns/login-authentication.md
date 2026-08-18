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
| Page canvas | centered content on `--color-background` | No Header/Sidebar product chrome |
| Brand | product name / home [Link](../components/link.md) or mark | Identity only; not a marketing hero |
| Form surface | [Card](../components/card.md) | Contains the auth form |
| Fields | [FormField](../components/form-field.md) | Email/username [Input](../components/input.md), password Input (`type="password"`), optional OTP Input |
| Submit | [Button](../components/button.md) | "Sign in" primary; full width of the Card content is acceptable |
| Errors | [Alert](../components/alert.md) and/or [ValidationMessage](../components/validation-message.md) | Auth failures use Alert (what / why / now); field format errors use ValidationMessage |
| Secondary nav | [Link](../components/link.md) | Forgot password, SSO, create account — text Links, not a Sidebar |
| Busy | Button loading Spinner; optional [Spinner](../components/spinner.md) only if no Button loading affordance | Prevent double submit |

Tokens: canvas `--color-background`, Card `--color-surface` / `--color-border`,
text `--color-foreground` / `--color-muted-foreground`, primary action
`--color-primary`, focus `--color-focus`. Keep flourish out of error copy
([voice-and-tone](../voice-and-tone.md)).

## Flow

1. Unauthenticated person hits a protected route or opens the login URL.
2. Show login Card; focus the first FormField.
3. Person submits credentials.
4. On success: establish session and route into the application shell (deep
   link to the originally requested path when safe).
5. On failure: keep credentials where safe (usually clear password); show Alert
   with recovery (retry, reset password, contact admin) — never a cryptic code
   alone.
6. Sign-out returns to this pattern (or a signed-out confirmation that Links
   back to Sign in).
7. Session expired: same layout with an Alert explaining the session ended and
   that signing in continues to the previous destination when possible.

SSO: primary Button or Link "Continue with …" above or instead of password
fields; do not hide password auth without a documented product decision.

## States

| State | Behavior |
| --- | --- |
| default | Brand + Card + fields + Sign in. |
| loading (submit) | Primary Button loading; inputs read-only or inert; no full-page Spinner that hides the form. |
| invalid fields | ValidationMessage on email/password format; focus first invalid field. |
| error (auth) | Alert with what / why / now (for example wrong credentials, locked account, IdP failure); form remains. |
| empty | Not applicable as a collection; do not use EmptyState for "no session". |
| success | Brief transition into the shell; optional Toast is unnecessary if navigation is immediate. |

## Layout sketch

```text
┌──────────────────────────────────────────────────────────────────────┐
│ --color-background                                                   │
│                                                                      │
│                         Momoi Product                                │
│                   ┌────────────────────────┐                         │
│                   │ Card: Sign in          │                         │
│                   │                        │                         │
│                   │ Alert (auth error)     │                         │
│                   │                        │                         │
│                   │ FormField  Email       │                         │
│                   │ FormField  Password    │                         │
│                   │                        │                         │
│                   │ [ Sign in ]            │                         │
│                   │                        │                         │
│                   │ Forgot password?       │                         │
│                   │ Continue with SSO      │                         │
│                   └────────────────────────┘                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

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
