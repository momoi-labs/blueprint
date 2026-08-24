# Settings

Configuration pages with predictable form layout and explicit save behavior.
Settings are preferences and product configuration — not entity CRUD for a
list of resources.

User story #31.

## Purpose

Let the person change durable product or workspace options with clear grouping,
immediate vs deferred persistence, and unambiguous save feedback.

## Component composition

| Region | Compose with | Role |
| --- | --- | --- |
| Page framing | [PageHeader](../components/page-header.md) | "Settings" or section title; optional save actions when the page uses explicit save |
| Section nav | [Tabs](../components/tabs.md) or Sidebar sub-nav [Link](../components/link.md)s | Split General / Notifications / API, etc. |
| Groups | [Card](../components/card.md) | One settings group per Card |
| Text / choice fields | [FormField](../components/form-field.md) | [Label](../components/label.md) + [Input](../components/input.md) / [Select](../components/select.md) / [Textarea](../components/textarea.md) + [HelperText](../components/helper-text.md) + [ValidationMessage](../components/validation-message.md) |
| Booleans | [Switch](../components/switch.md) (immediate) or [Checkbox](../components/checkbox.md) inside FormField (part of a saved form) | Switch for single immediate preferences; Checkbox when the value submits with Save |
| Actions | [Button](../components/button.md) | Save (primary), Reset/Cancel (secondary) for explicit-save sections |
| Feedback | [Toast](../components/toast.md), [Alert](../components/alert.md), [ValidationMessage](../components/validation-message.md) | Saved confirmation; section errors; field errors |
| Shell | [Application shell](application-shell.md) | Authenticated framing |

Tokens: `--color-background` canvas, `--color-card` Cards, `--color-border`
separators, `--color-foreground` / `--color-muted-foreground` copy,
`--color-primary` for current section/nav, `--color-ring` on controls.

## Theme

Appearance is a settings row like any other: label left, control right, inside
a Card with the rest of the preferences. Use
[ThemeSelector](../components/theme-selector.md); that contract owns the
values, persistence, and markup.

Three points bind here rather than there:

- The default is `system` — no `data-theme` attribute on `<html>` — and it
  keeps following the OS while the page is open.
- The choice is local and instant. It persists to `localStorage` under
  `kiso-theme`; it does not go through the section's Save button, and it does
  not raise a "Settings saved" Toast.
- It is exempt from the explicit-save rule above for the same reason a Switch
  is: the person sees the result immediately, so a confirmation would only
  restate what already happened.

```text
Card: Appearance
  Theme                                   [ ▣ ][ ☀ ][ ☾ ]
```

## Flow

### Explicit save (default for multi-field sections)

1. Person opens Settings and optionally a section Tab.
2. Edits FormFields; Save stays disabled until dirty (recommended) or remains
   available — pick one rule per product and keep it.
3. Save validates; ValidationMessage on fields; Alert for section-level
   failures (what / why / now).
4. On success: Toast "Settings saved" (or equivalent); clear dirty state.
5. Leaving a dirty section prompts only when unsaved loss is material.

### Immediate Switch

1. Person toggles Switch.
2. Value persists immediately; failure reverts the Switch and shows Toast or
   inline Alert with recovery.
3. Do not also require Save for that same boolean.

Do not mix both persistence models inside one Card without labeling which
controls save immediately.

## States

| State | Behavior |
| --- | --- |
| loading | Skeleton for known Card/field layout; keep section nav visible. |
| empty | Rare; if a section has no configurable options yet, short explanatory copy — not a collection EmptyState. |
| dirty | Visual cue that Save applies; warn on navigate-away when appropriate. |
| invalid | Field ValidationMessage; focus first error; preserve other values. |
| saving | Save Button loading; prevent duplicate submits. |
| error | Alert with what / why / now; values preserved; Switch failures revert. |
| success | Toast or quiet confirmation; do not block the page. |

## Layout sketch

```text
┌──────────────────────────────────────────────────────────────────────┐
│ PageHeader: Settings                                                 │
│ Tabs: [General]  Notifications  API                                  │
├──────────────────────────────────────────────────────────────────────┤
│ Card: Workspace                                                      │
│   FormField  Display name                                            │
│   FormField  Default region     [Select]                             │
│                                                                      │
│ Card: Query defaults                                                 │
│   Switch     Persist query history                                   │
│   FormField  Statement timeout                                       │
│                                                                      │
│                                      [Reset]  [Save changes]         │
└──────────────────────────────────────────────────────────────────────┘
```

## When to use

- Product, workspace, or user preference screens.
- Multi-section configuration that is not a resource list.

## When NOT to use

- Creating/editing listed resources (connections, users as entities) —
  [CRUD](crud.md) + [List-detail](list-detail.md).
- One-off destructive operations — confirmation / destructive-action patterns.

## Related patterns

- [CRUD](crud.md) — entity forms vs preference forms.
- [Application shell](application-shell.md)
- [Login / authentication](login-authentication.md) — account recovery and
  auth entry, not general settings.
