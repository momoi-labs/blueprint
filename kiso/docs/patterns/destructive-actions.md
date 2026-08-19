# Destructive actions

Require confirmation with clear consequences before an irreversible or
high-impact action. This pattern composes [Modal / Dialog](../components/modal-dialog.md)
and the destructive [Button](../components/button.md) variant, and governs when
confirmation is mandatory, what it must say, and how it behaves.

User stories #11, #12.

## Purpose

A destructive action cannot be undone, or its undo is expensive, slow, or
hidden: delete a database, drop a table, disconnect a live connection, purge
logs, revoke a key. The person must understand the consequence **before** the
action commits, and must be able to cancel without penalty.

This pattern is the gate; [confirmations](confirmations.md) is the broader
dialog spec (risk explanation, acknowledgment, copy structure). A destructive
action always uses a confirmation; not every confirmation is destructive.

## Component composition

| Region | Compose with | Role |
| --- | --- | --- |
| Trigger | [Button](../components/button.md) `destructive` or [IconButton](../components/icon-button.md) `destructive` | Opens the confirmation; does not commit directly |
| Confirmation dialog | [Modal / Dialog](../components/modal-dialog.md) | Blocks the page; requires explicit confirm or cancel |
| Confirm action | [Button](../components/button.md) `destructive` inside the dialog | Commits the destructive action; the only destructive control in the dialog |
| Cancel action | [Button](../components/button.md) `default` or `ghost` inside the dialog | Closes without committing; always available |
| Progress | [Spinner](../components/spinner.md) inside the confirm Button | While the action is in flight; `aria-busy` |
| Success / failure | [Toast](../components/toast.md) or [Alert](../components/alert.md) | After the dialog closes (see States) |

The destructive `Button` variant uses `--color-danger` for its border/text (not
a filled danger panel that shouts past contrast). The confirm Button inside the
dialog is the **only** destructive-styled control; the dialog surface itself
does not use danger color.

## Flow

1. Person activates a destructive trigger (e.g. "Delete replica").
2. A [Modal / Dialog](../components/modal-dialog.md) opens with focus moved to
   the first meaningful element (usually the cancel Button, to make the safe
   path the default).
3. The dialog names the action and its consequence in plain language (see
   [confirmations](confirmations.md) for copy structure).
4. Person confirms or cancels:
   - **Cancel** (or `Escape`, or overlay click when safe): dialog closes, focus
     returns to the trigger, nothing changes.
   - **Confirm**: the confirm Button enters loading
     ([Spinner](../components/spinner.md), `aria-busy`). Cancel stays available
     while the action is in flight, unless the action cannot be safely
     interrupted.
5. On success, the dialog closes and a [Toast](../components/toast.md) confirms
   the outcome ("Replica 'prod-eu' deleted"). On failure, an
   [Alert](../components/alert.md) explains what/why/now and the dialog may stay
   open with the error next to the confirm action.

## States

| State | Behavior |
| --- | --- |
| closed | Trigger available; no dialog. |
| open | Page behind is inert; focus trapped in dialog. Cancel and confirm available. |
| submitting | Confirm Button shows [Spinner](../components/spinner.md), `aria-busy`. Duplicate submission prevented. Cancel stays available unless interruption is unsafe. |
| error | Recoverable error shown next to the confirm action or as an [Alert](../components/alert.md) inside the dialog. Dialog stays open. The destructive action did **not** commit. |
| success | Dialog closes; [Toast](../components/toast.md) confirms. If the deleted entity was the current view, navigate to the parent list. |

`Escape` closes the dialog **unless** the destructive operation is in flight
and cannot be safely interrupted — in that case, `Escape` is inert or shows a
brief "Action in progress" status. Document this per surface.

## Layout sketch

```text
┌─────────────────────────────────────────────┐
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ Delete "prod-eu"?                     │  │
│  │                                       │  │
│  │ This replica will be removed from the │  │
│  │ workspace. Active queries to it will  │  │
│  │ be terminated. This cannot be undone. │  │
│  │                                       │  │
│  │           [Cancel]  [Delete replica]  │  │
│  └───────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

`Delete replica` is the only destructive-styled control. `Cancel` is the
default focus target so the safe path is one `Enter` away.

## Rules

- **Always confirm destructive actions.** Do not commit on the trigger alone.
  A single-click delete with no confirmation is a spec violation, even if the
  trigger has a destructive variant.
- Name the action and its consequence. "Delete 'prod-eu'?" with "This cannot
  be undone" or "Active queries will be terminated." Follow
  [voice-and-tone](../voice-and-tone.md): match the confirmation's weight to
  the action's irreversibility — do not wrap a low-stakes action in danger
  color, and do not under-state a high-stakes one.
- The confirm Button is the **only** destructive control in the dialog. Do not
  style the dialog surface, title, or body with `--color-danger`.
- Cancel is always available and is the safe default. Prefer focusing Cancel on
  open so a reflexive `Enter` does the safe thing.
- Do not use "Are you sure?" as the only confirmation. State what will happen:
  "This replica will be removed. Active queries will be terminated."
- For type-to-confirm (delete a named resource by typing its name), require the
  exact name. Use an [Input](../components/input.md) in the dialog; the confirm
  Button stays disabled until the typed value matches. Reserve this for the
  highest-stakes actions (drop database, delete workspace).
- After success, do not leave the person on a deleted entity. Navigate to the
  parent list or a neutral state.
- A destructive action triggered from the [command palette](command-palette.md)
  still opens a confirmation dialog — the palette is acceleration, not a bypass
  for the gate.

## Accessibility

- Dialog: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (title),
  `aria-describedby` (consequence) when the description is not the title.
- Focus moves to the first meaningful element on open (usually Cancel). `Tab`
  and `Shift+Tab` cycle inside; `Escape` closes unless the action is
  uninterruptible.
- The confirm Button's accessible name includes the action: "Delete replica",
  not "Confirm" or "OK".
- On error, move focus to the error [Alert](../components/alert.md) or the
  confirm action so the person lands on the recovery path.
- Type-to-confirm: the [Input](../components/input.md) has a
  [Label](../components/label.md) ("Type 'prod-eu' to confirm"); the disabled
  confirm Button has an accessible explanation of why it is disabled.

## Related patterns

- [Confirmations](confirmations.md) — the broader dialog spec: risk
  explanation, acknowledgment, copy structure.
- [Command palette](command-palette.md) — destructive commands still confirm.
