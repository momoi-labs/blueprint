# Onboarding

Onboarding guides a new person through the minimum setup required to reach a
useful product state. It is a finite task flow, not a product tour, marketing
carousel, or substitute for clear everyday UI.

## Component composition

- [Card](../components/card.md) groups each setup task or the active task.
- [Button](../components/button.md) performs setup actions; at most one primary
  Button advances the current step.
- [Link](../components/link.md) opens optional documentation or a route that
  must remain navigable.
- [FormField](../components/form-field.md), [Input](../components/input.md),
  [Select](../components/select.md), and their existing validation composition
  collect setup data.
- [Alert](../components/alert.md) and
  [ValidationMessage](../components/validation-message.md) handle failures at
  their proper scope. Skeleton or a loading Button handles pending work.

The issue calls the progress composition “Steps”, but Kiso has no Steps
component. Represent progress as a semantic ordered list with current and
completed text states; do not invent a new component in this pattern.

Cards use `--color-card`, `--color-border`, `--radius-surface`, and semantic
spacing. Current-step emphasis uses `--color-primary`; completed status may use
`--color-success`; primary and secondary copy use `--color-foreground` and
`--color-muted-foreground`. Keyboard focus uses `--color-focus`.

## Flow

1. Define the first useful outcome and include only setup steps required to
   reach it.
2. Show the total sequence and identify the current step in text.
3. Explain why the current input or permission is needed before asking for it.
4. Preserve valid input while an action loads or fails. Advance only after the
   step succeeds.
5. Let the person go back without losing completed work. Offer **Skip** only
   for genuinely optional steps and state the consequence.
6. Finish in the useful product view, not a celebration screen that blocks the
   next task. Keep a way to resume incomplete setup later.

Do not force onboarding when the required state already exists. Returning
people resume at the first incomplete required step; they do not replay the
whole flow.

## States

| State | Treatment |
| --- | --- |
| New / incomplete | Show ordered progress, the current Card, and one primary advance action. |
| Loading | Preserve fields and progress; the active Button shows Spinner or known Card content uses Skeleton. |
| Empty dependency | Explain the missing prerequisite and offer the action that creates or connects it; do not show a generic empty dashboard. |
| Validation error | Keep the step open and show ValidationMessage at the field. |
| Operation error | Keep the step open, show an actionable Alert using what/why/now, and allow retry. |
| Permission denied | Explain the blocked setup task and access path with the permission-denied pattern; do not call the whole onboarding failed. |
| Complete | Mark required steps complete and navigate to the useful destination. |

## Layout sketch

```text
PageHeader: Set up your workspace

1. Workspace details     Complete
2. Connect database      Current
3. Invite team           Optional

┌─ Card: Connect database ────────────────────────────────┐
│ Add a connection to run your first query.               │
│                                                         │
│ Connection name                                         │
│ [production___________________________________________]  │
│ Database URL                                             │
│ [postgres://__________________________________________]  │
│                                                         │
│ Docs                              [Back] [Test connection]│
└─────────────────────────────────────────────────────────┘
```

`Docs` is a Link. `Back` and `Test connection` are Buttons; only **Test
connection** is primary. The ordered list communicates “2 of 3” and current,
completed, and optional states in text rather than color alone.

## Accessibility and copy

- Use an ordered list for progress and expose the current item with text and
  `aria-current="step"`. Announce step changes politely and move focus to the
  new step heading.
- Keep native form order and visible labels. Back navigation must not discard
  input without warning.
- Do not use disabled future steps as the only explanation of prerequisites.
  State what is needed beside the active task.
- Keep copy direct and task-oriented. Avoid tours, jargon without context,
  playful filler, and terminal flourish in functional text.
