# Errors

Use an error state when an operation failed or valid content could not be
loaded. Every error must explain a recovery path; a code, danger color, or
“Something went wrong” is not sufficient.

Permission denied is not a generic error. When the system succeeded in
determining that access is missing, use the
[permission-denied pattern](permission-denied.md).

## Component composition

- [Alert](../components/alert.md) presents page-, section-, and operation-level
  errors in context with an optional recovery Button or Link.
- [ValidationMessage](../components/validation-message.md) presents a
  field-level error beside its FormField and points to the affected control.
- [Button](../components/button.md) performs an immediate recovery such as
  retry; [Link](../components/link.md) navigates to settings or documentation.
- [Toast](../components/toast.md) is only for a brief failure whose recovery is
  already available in context. Never put the only explanation or action in a
  transient Toast.

Error meaning uses `--color-danger`; primary and supporting copy use
`--color-foreground` and `--color-muted-foreground` on `--color-surface`.
Recovery controls retain their semantic component tokens, including
`--color-focus`. Do not fill the whole region with danger color.

## Mandatory what / why / now structure

Every error follows the hard rule in
[voice and tone](../voice-and-tone.md), in this order:

1. **What happened.** Name the failed operation or unavailable content.
2. **Why, when known.** Give a brief verified cause. Omit this part when the
   cause is unknown; never guess.
3. **What to do now.** Give a concrete recovery action or next step.

```text
What: Connection to the database failed.
Why:  The server at db.example.com:5432 did not respond within 5 seconds.
Now:  Check that the database is reachable, then retry.        [Retry]
```

Keep diagnostic identifiers as secondary, copyable details when they help
support or debugging. They never replace the human explanation.

## Flow

1. Stop the pending presentation and preserve the person's input and context.
2. Classify the scope: field, operation/section, or whole page.
3. Write what happened, the known reason, and what the person can do now.
4. Place the message beside the affected content and expose the recovery as a
   Button or Link when it can be performed directly.
5. Move or announce focus appropriately. On retry, keep the Alert visible with
   its Button loading until the outcome is known.
6. On success, remove the resolved error; on repeated failure, update verified
   details without stacking duplicate Alerts.

## States

| State | Treatment |
| --- | --- |
| Loading / retrying | Keep the error explanation visible; the recovery Button shows Spinner and the affected region is busy. |
| Field error | ValidationMessage follows what/why/now at the smallest useful scale and is linked to the invalid control. |
| Section or page error | One persistent Alert sits before or in place of the affected content. |
| Unknown cause | State what failed and what to do now; omit why. |
| Permission denied | Switch to the permission-denied pattern, without error severity or retry loops. |
| Recovered | Remove the Alert, clear stale invalid state, and restore the content without a redundant success message unless confirmation is needed. |

## Layout sketch

```text
PageHeader: Query results
┌─ Alert: error ───────────────────────────────────────────┐
│ Query results could not be loaded.                       │  What
│ The database connection closed during execution.        │  Why
│ Reconnect, then retry the query.       [Reconnect]       │  Now
└──────────────────────────────────────────────────────────┘

FormField: Connection name
[production db___________________________________________]
ValidationMessage: Use letters, numbers, hyphens, or underscores. [What/now]
```

## Accessibility and copy

- Use one assertive Alert for a newly introduced blocking error. Avoid several
  competing live regions.
- On failed submission, focus the error summary or first invalid control.
  Recovery actions remain reachable by keyboard and use visible focus.
- Error meaning must be present in text and iconography, not color alone.
- Be direct and non-accusatory. Do not apologize, joke, add terminal flourish,
  or expose cryptic codes without context.
