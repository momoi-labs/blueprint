# Alert

An in-page message about a condition the person should see in context.
Severity is explicit. It stays until dismissed or until the condition ends.

## Purpose

Alert explains something about *this view*: a failed load, a degraded
replica, a successful save that still needs a next step, a warning before
continuing. It sits in the page flow, not in a corner toast and not on a
single form field.

User stories #6 and #24.

### Choose the right feedback

| Need | Control | Why |
| --- | --- | --- |
| In-page condition, stays in context | **Alert** | Persistent or dismissible, with severity. |
| Transient system notice (saved, copied, background job) | **Toast** (overlay slice) | Time-limited; must not be the only copy of essential info. |
| A specific field is invalid | **ValidationMessage** (form slice) | Anchored to the field; not a page banner. |

Do not restyle Alert into a toast. Do not use Alert for every validation
error in a form.

## Anatomy

```
Alert
├── severity icon (required)
├── Title (required)
├── Description (required for error and warning; optional for info/success
│   when the title is already a complete sentence)
├── Action (optional: recovery Button or Link)
└── Dismiss (optional IconButton; only when dismissible)
```

- **Severity icon.** Matches the variant. Decorative if the title names the
  severity in words; otherwise the accessible name of the Alert must include
  the severity ("Error: replica unreachable").
- **Title.** What happened. Direct. Not "Oops", not an error code alone.
- **Description.** Follow [voice-and-tone](../voice-and-tone.md) for errors:
  what happened, why when knowable, what the person can do now. Warning uses
  the same structure with a lower-stakes next step. Info/success: what is
  true, and a next step if there is one.
- **Action.** A real [Button](button.md) or [Link](link.md) that performs the
  recovery ("Retry", "Open settings"). Do not bury the only recovery in
  Description prose if a control can do it.
- **Dismiss.** [IconButton](icon-button.md) `ghost` `sm`, `aria-label`
  "Dismiss". Only on dismissible Alerts.

## Variants

Four severities. There is no extra "destructive" variant — that is `error`.

| Variant | Live region | Tokens |
| --- | --- | --- |
| `info` | `role="status"` (polite) | Border and icon `--color-info`. Title `--color-foreground`. Description `--color-muted-foreground`. Background `--color-surface`. |
| `success` | `role="status"` (polite) | Same structure with `--color-success`. |
| `warning` | `role="status"` (polite) unless the person must stop; then `role="alert"` | `--color-warning`. |
| `error` | `role="alert"` (assertive) | `--color-danger` (the danger role *is* error). |

Radius `--radius-lg`; an Alert is a callout inside content, not a panel, so it
carries no corner marks. Tinted variants use `--color-success-surface` /
`--color-warning-surface` / `--color-danger-surface` / `--color-info-surface`
with the matching `*-border`. Padding `--spacing-md`. Gap `--spacing-sm`. Title
uses the five `--type-role-label-font-family`, `--type-role-label-font-size`,
`--type-role-label-font-weight`, `--type-role-label-letter-spacing`, and
`--type-role-label-line-height` properties. Description uses the corresponding
`--type-role-body-font-family`, `--type-role-body-font-size`,
`--type-role-body-font-weight`, `--type-role-body-letter-spacing`, and
`--type-role-body-line-height` properties.

Do not fill the Alert with the status color. Status color is border, icon,
and (optionally) title. A solid `--color-danger` panel fights contrast and
shouts past the content.

### Dismissible vs persistent

| Kind | Behavior |
| --- | --- |
| **Persistent** | Stays while the condition is true (replica down, missing permission). No dismiss. Removing it is lying. |
| **Dismissible** | The person can clear it. Use for success confirmations and informational callouts that do not affect the next action. After dismiss, do not show the same Alert again in this visit unless the condition reoccurs. |

Default for `error` and `warning` that describe a current blocker:
persistent. Default for `success` and `info`: dismissible.

## Sizes

One size. Do not scale Alert like Button. Density comes from the type roles
above. In a narrow Card, the Alert still uses `--spacing-md` padding; it
does not shrink to `sm`.

## States

| State | Behavior |
| --- | --- |
| default | Visible, in flow. |
| hover / active | No Alert-level hover. Children (Action, Dismiss) have their own states. |
| focus | Focus moves to Action or Dismiss, not the Alert box. When an `error` Alert appears as a result of a submit, move focus to the Alert (or to its Action) so assistive tech and keyboard users land on it. |
| disabled | N/A. Hide or replace the Alert; do not disable it. |
| loading | If the condition is being retried, the Action Button shows [Spinner](spinner.md) loading. The Alert remains. |
| error | `error` is a variant, not a state on top of another variant. |

## Accessibility

- `error`: `role="alert"` (implicit `aria-live="assertive"`). Use sparingly;
  assertive interruptions stack badly. One error Alert at a time in a view.
- `info` / `success` / most `warning`: `role="status"` (`aria-live="polite"`).
- Name the Alert: `aria-labelledby` pointing at Title, `aria-describedby` at
  Description.
- Severity is in text (title or prefix), not color alone.
- Dismiss is an IconButton with `aria-label="Dismiss"`. After dismiss, move
  focus to a sensible place (the control that caused the Alert, or the main
  heading) — do not dump focus to `body`.
- Do not nest interactive content other than Action and Dismiss.
- Do not use Radix Alert Dialog here. Alert Dialog is a modal. This
  component never blocks the page.

### Keyboard

| Key | Action |
| --- | --- |
| `Tab` / `Shift+Tab` | Move between Action and Dismiss (and the rest of the page). |
| `Enter` / `Space` | Activate the focused Button / IconButton (including Dismiss). |

## When to use

- A condition about this page or section the person should see before
  continuing: load failure, permission, degraded dependency, completed save
  with a next step.
- Inline, above the affected content (form, table, replica panel).
- Recovery can be offered as a Button or Link inside the Alert.

## When NOT to use

- **Field-level validation.** ValidationMessage next to the input.
- **Transient confirmations** that must not block reading ("Copied"). Toast.
- **Status labels** without explanation ("live"). [Badge](badge.md).
- **A whole empty dataset.** EmptyState (data slice), optionally with a
  Button, not an info Alert that says "nothing here".
- **Blocking work that needs a decision.** Modal/Dialog (overlay slice).
  Alert does not trap focus and does not block the page.
- **Marketing callouts.** If it is not a condition of the product state, it
  does not belong.

## Radix/shadcn mapping

There is **no** Radix primitive for in-page Alert.

| Kiso | Reference |
| --- | --- |
| Structure, icon + title + description + action | shadcn [Alert](https://ui.shadcn.com/docs/components/alert) (`Alert`, `AlertTitle`, `AlertDescription`, `AlertAction`) |
| Dismiss | Compose [IconButton](icon-button.md); shadcn has no dedicated dismiss slot |
| `error` | shadcn `variant="destructive"` restyled to `--color-danger` (border/icon, not a filled danger panel) |
| `info` / `success` / `warning` | shadcn `default` plus the matching `--color-info`, `--color-success`, or `--color-warning` — **not** the shadcn "Custom Colors" utility-class example (`bg-amber-50`, etc.) |

Do **not** map this component to Radix
[Alert Dialog](https://www.radix-ui.com/primitives/docs/components/alert-dialog)
or shadcn Alert Dialog. Those are modal confirmation overlays (later slice:
Modal/Dialog). Using them here collapses the Alert vs Modal distinction.
