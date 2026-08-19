# Permission denied

Permission denied is a distinct product state: the requested resource or action
exists, and the system has determined that the current person cannot access it.
It is not a generic error, an empty collection, or a failed request.

## Component composition

- Use [Alert](../components/alert.md) with `info` semantics when a denied action
  sits inside otherwise available content.
- Use [EmptyState](../components/empty-state.md) as a dedicated locked state
  when denial replaces an entire bounded region or page. Its title and
  description explain access, never emptiness.
- Use [Link](../components/link.md) to open access documentation, workspace
  settings, or a request-access route.
- Use [Button](../components/button.md) only when the product can submit an
  access request directly. Do not present a retry action unless permissions may
  genuinely have changed.

Permission-denied content uses `--color-foreground` and
`--color-muted-foreground` on `--color-surface` or `--color-background`.
An informational Alert may use `--color-info`. **Do not use
`--color-danger`: denied access is not an error severity.** Link and focus
treatments use `--color-primary` and `--color-focus`.

## Flow

1. Identify exactly which resource or action is blocked.
2. State the applicable access rule or required role when known.
3. Offer the shortest real route to access: request access, contact a named
   role, or open access settings/documentation.
4. Preserve navigation and any safe surrounding context. Hide protected data
   rather than rendering redacted fragments that reveal its shape.
5. If access is granted, re-check authorization and replace the denied state
   with loading, then the authorized result.

Copy follows **blocked / why / access path**:

> You can't edit this query. Only the query author and workspace admins can
> edit it. Ask a workspace admin to grant you access.

This resembles the clarity of what/why/now, but it does not label the condition
as a failure and does not use error severity.

## States

| State | Treatment |
| --- | --- |
| Checking access | Show the loading pattern without protected content. Do not flash a denied state before authorization resolves. |
| Action denied | Keep available content and place an informational Alert beside the blocked action. Explain why the control is absent or unavailable. |
| Region/page denied | Replace protected content with a dedicated locked EmptyState composition and one access path when available. |
| Requesting access | The request Button shows its loading state; keep the explanation visible and prevent duplicates. |
| Request sent | Confirm in context with the expected next step; do not imply access is already granted. |
| Access granted | Re-enter loading, then show authorized content. |
| Access check failed | Use the errors pattern. An inability to determine permission is a system failure, not a denial. |

## Layout sketch

```text
PageHeader: Production workspace
Breadcrumb and safe workspace navigation remain visible
┌─────────────────────────────────────────────────────────┐
│                    Restricted query                     │
│ You can't view this query. It is limited to members     │
│ of the Production Operators group.                      │
│                                                         │
│ [Request access]        Access policy                   │
└─────────────────────────────────────────────────────────┘
```

`Request access` is a Button because it submits an action. `Access policy` is a
Link because it navigates. If neither path exists, say whom to contact and omit
the action rather than showing a disabled control.

## Accessibility and copy

- Name the denied region from its title. Use a polite status for a denial that
  appears after interaction; reserve assertive alerts for actual urgent errors.
- Move focus to the explanation when denial follows activation and the person
  would otherwise land on removed content.
- Do not disclose protected names, counts, field values, or membership beyond
  what the person is allowed to know.
- Avoid “Access denied,” “unauthorized,” blame, corporate language, and false
  retry actions. State what is blocked, why, and how to request access.
