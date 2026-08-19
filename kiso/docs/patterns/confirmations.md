# Confirmations

Explain risk and require explicit acknowledgment before a consequential action.
This pattern is the dialog spec for any confirmation — destructive or not —
covering copy structure, focus, and the acknowledgment model. Destructive
actions ([destructive-actions](destructive-actions.md)) always use this pattern;
not every confirmation is destructive.

User story #12.

## Purpose

A confirmation interrupts the person before an action whose consequence is
non-obvious, delayed, or hard to reverse: disconnect a live connection, apply a
config change to production, revoke access, overwrite a resource. The
confirmation makes the consequence explicit and requires a deliberate choice.

It is not a courtesy "are you sure?" for routine actions. Over-confirming
trains the person to click through without reading; reserve confirmations for
genuine risk.

## Component composition

| Region | Compose with | Role |
| --- | --- | --- |
| Dialog | [Modal / Dialog](../components/modal-dialog.md) | Blocks the page; focused task |
| Title | Dialog Title | Names the action in product language ("Disconnect 'staging-db'?") |
| Consequence | Dialog Description | What will happen, in plain language |
| Confirm action | [Button](../components/button.md) — variant matches stakes | Commits the action |
| Cancel action | [Button](../components/button.md) `default` or `ghost` | Closes without committing; always available |
| Acknowledgment (high-stakes) | [Checkbox](../components/checkbox.md) or type-to-confirm [Input](../components/input.md) | Required before confirm is enabled |
| Progress | [Spinner](../components/spinner.md) inside confirm Button | While the action is in flight |

## Flow

1. Person activates a trigger that opens the confirmation.
2. [Modal / Dialog](../components/modal-dialog.md) opens with focus on the first
   meaningful element (usually Cancel).
3. The dialog states the action and its consequence. For high-stakes actions, an
   acknowledgment step (checkbox or type-to-confirm) gates the confirm Button.
4. Person confirms or cancels.
   - **Cancel** / `Escape` / overlay click (when safe): dialog closes, focus
     returns to trigger, nothing changes.
   - **Confirm**: Button enters loading; action runs.
5. On success, dialog closes and feedback follows ([Toast](../components/toast.md)
   for brief confirmation, navigation if the context changed). On failure,
   error [Alert](../components/alert.md) inside the dialog with recovery.

## States

| State | Behavior |
| --- | --- |
| closed | Trigger available. |
| open | Page inert; focus trapped. Cancel available; confirm available or gated. |
| gated | High-stakes: confirm Button disabled until acknowledgment complete (checkbox checked, or typed name matches). |
| submitting | Confirm Button loading ([Spinner](../components/spinner.md), `aria-busy`). Cancel available unless uninterruptible. |
| error | Recoverable error as [Alert](../components/alert.md) inside dialog; dialog stays open. |
| success | Dialog closes; [Toast](../components/toast.md) or navigation. |

## Copy structure

Confirmation copy follows [voice-and-tone](../voice-and-tone.md):

- **Title:** Name the action and the object. "Disconnect 'staging-db'?" — not
  "Warning" or "Confirm".
- **Consequence:** What will happen, in one or two sentences. State the
  irreversibility or side effect directly: "Active queries will be
  terminated." Do not say "Are you absolutely sure?" — state the fact.
- **Match weight to stakes.** A low-stakes action (leave a draft unsaved) gets
  a neutral dialog. A high-stakes action (drop database) gets type-to-confirm.
  Do not wrap a low-stakes action in danger color, and do not under-state a
  high-stakes one.

Anti-patterns (from voice-and-tone):
- "Are you absolutely sure?"
- "Oops! Are you sure you want to..."
- Danger color on a low-stakes confirmation.
- No consequence stated, only "Confirm / Cancel".

## Layout sketch

### Standard confirmation

```text
┌──────────────────────────────────────────┐
│ Disconnect "staging-db"?                 │
│                                          │
│ Active queries to this database will be  │
│ terminated. The connection can be        │
│ re-established later.                    │
│                                          │
│              [Cancel]  [Disconnect]      │
└──────────────────────────────────────────┘
```

### High-stakes (type-to-confirm)

```text
┌──────────────────────────────────────────┐
│ Drop database "production"?              │
│                                          │
│ All tables, data, and replicas in this   │
│ database will be permanently deleted.    │
│ This cannot be undone.                   │
│                                          │
│ Type the database name to confirm:       │
│ [production                       ]      │
│                                          │
│              [Cancel]  [Drop database]   │
└──────────────────────────────────────────┘
```

`Drop database` stays disabled until "production" is typed exactly. The
confirm Button is the only destructive-styled control.

## Rules

- Confirm only when there is genuine consequence. Routine saves, toggles, and
  navigation do not need confirmation; over-confirmation trains click-through.
- State the consequence, not a question. "Active queries will be terminated"
  beats "Are you sure you want to disconnect?"
- The confirm Button's variant matches the stakes:
  - Destructive (delete, drop, purge) → `destructive` variant.
  - Consequential but not destructive (disconnect, revoke, apply to production)
    → `default` variant, possibly with a warning tone in the copy.
  - Low-stakes (discard draft) → `default`.
- Cancel is always available and is the safe default. Prefer focusing Cancel on
  open.
- High-stakes actions use acknowledgment:
  - **Checkbox:** "I understand this cannot be undone" — for actions where the
    person must consciously accept irreversibility.
  - **Type-to-confirm:** type the exact resource name — for the highest-stakes
    actions (drop database, delete workspace). Reserve sparingly; overuse makes
    it friction without safety.
- Do not use [Toast](../components/toast.md) as a confirmation. Toast is
  transient and cannot require a decision. If a decision is needed, it is a
  dialog.
- Do not auto-confirm after a timeout. The person must explicitly choose.

## Accessibility

- Dialog: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`,
  `aria-describedby` (consequence).
- Focus to first meaningful element on open (usually Cancel). `Tab` /
  `Shift+Tab` cycle inside; `Escape` closes when safe.
- Confirm Button accessible name includes the action: "Disconnect", "Drop
  database" — not "Confirm".
- Gated confirm: the disabled Button has an accessible explanation ("Type the
  database name to enable Drop database"). The acknowledgment
  [Checkbox](../components/checkbox.md) or [Input](../components/input.md) has a
  [Label](../components/label.md).
- On error, move focus to the error [Alert](../components/alert.md) so the
  person lands on the recovery path.

## Related patterns

- [Destructive actions](destructive-actions.md) — the specific gate for
  irreversible actions; always uses this confirmation spec.
