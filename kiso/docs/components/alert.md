# Alert

An in-page message about a condition the person should see in context.
Severity is explicit. It stays until dismissed or until the condition ends.

## Alert is now smart

Severity drives the defaults, so a caller sets `variant` and gets the rest:

| Severity | Role | Loud icon | Default tape | Dismiss default | Placement default |
| --- | --- | --- | --- | --- | --- |
| `error` | `role="alert"` | filled circle-alert | `top` | persistent | inline; overlay when the whole app is down |
| `warning` | `role="status"` | filled triangle-alert | `top` | persistent | inline |
| `info` | `role="status"` | filled info | `none` | dismissible | inline |
| `success` | `role="status"` | filled circle-check | `none` | dismissible | inline |

- **Role.** Alert sets the live region from the severity. Pass `role` only to
  override it, for example `role="note"` on static documentation.
- **Icon.** With `appearance="loud"`, Alert renders the icon itself. With
  `tinted` or `rail`, the caller still passes the icon as the first child.
- **Dismiss.** Pass `onDismiss` and Alert renders the Dismiss IconButton.
  After the click, focus returns to the element that had it when the Alert
  appeared, or to the main heading. A persistent condition omits `onDismiss`.
- **Placement.** `placement="inline"` is the default. `placement="overlay"`
  pins the Alert to the top of the viewport. Only one overlay Alert shows at a
  time.

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
├── Title (required), or Label + Message for rich content
├── Description (required for error and warning; optional for info/success
│   when the title is already a complete sentence)
├── Meta (optional: AlertMeta, time and impact)
├── Action (optional: recovery Button or Link)
├── Details (optional: AlertDetails, a disclosure with more context)
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
- **Details.** `AlertDetails` holds context that does not fit the
  description: timestamps, scope, a link to the incident. Alert renders a
  "Details" button with `aria-expanded` and `aria-controls`. The panel starts
  closed. A link inside Details uses the foreground color with an underline,
  because the link color is below 4.5:1 on a dark tint.
- **Dismiss.** [IconButton](icon-button.md) `ghost` `sm`, `aria-label`
  "Dismiss". Alert renders it when the caller passes `onDismiss`. Only on
  dismissible Alerts.
- **Label, Message and Meta.** Optional slots for an incident with a
  machine message. `AlertLabel` is a caps kicker that names severity and
  kind ("Critical · Database error"). `AlertMessage` is the message itself,
  in mono at `--type-size-body-large` (`--type-size-body` below 40rem).
  `AlertMeta` is a caps mono line with the time and the impact ("10:54:31 ·
  storefront refusing requests"), in `--color-muted-foreground`, or 85% of
  the loud foreground on a loud fill. Use Label and Message in place of
  Title and Description, not next to them.

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

Only the loud appearance fills the Alert with a status color. Use loud for a
blocking incident only, such as a primary that refuses connections, and show
at most one loud Alert per view. Everything else stays tinted or rail, where
status color is border, icon and (optionally) title.

### Appearance

Appearance is independent of severity. React accepts
`appearance="tinted" | "rail" | "loud"`; tinted is the default and preserves
the current presentation.
CSS consumers add `alert-rail` alongside the severity class for the rail
appearance. Both descriptions use the body typography role.

The rail appearance uses a start border in the severity color, a neutral
`--color-surface` background and square corners. The icon and title share the
first line; the description can use the full content width below them.
It is useful for explanatory notes within longer reading content. Use
AlertContent around the title and description, including for CSS consumers.
Its class is `alert-content`.

```tsx
<Alert variant="warning" appearance="rail" role="note">
  <WarningIcon className="icon" aria-hidden="true" />
  <AlertContent>
    <AlertTitle>Warning</AlertTitle>
    <AlertDescription>Memory grows with concurrent operations.</AlertDescription>
  </AlertContent>
</Alert>
```

### Loud

The loud appearance is a solid fill in the severity color, with hazard tape
and a filled icon whose mark is cut out. CSS consumers add `alert-loud` and
set `data-tape`.

| Severity | Fill | Text | Ratio |
| --- | --- | --- | --- |
| `error` | `--color-danger-solid` (#ad2f29) | `--color-danger-solid-foreground` (white) | 6.53:1 |
| `warning` | `--color-warning-solid` (#f2c230) | `--color-warning-solid-foreground` (#151411) | 11.00:1 |
| `info` | `--color-info-solid` (#2563b5) | `--color-info-solid-foreground` (white) | 5.95:1 |
| `success` | `--color-success-solid` (#1f7340) | `--color-success-solid-foreground` (white) | 5.86:1 |

Error is red and warning is yellow in both themes. The light theme uses a
flat fill. The dark theme adds a gradient from a deeper top (#872520 for
error, #dfb22c for warning) to the fill. Text keeps 4.5:1 or more on the fill
and on the gradient top.

- **Tape.** `tape="top" | "start" | "top-bottom" | "start-end" | "none"`.
  Stripes are 8px (`--spacing-sm`) at 45deg in `--color-tape` and the fill.
  The side tape is the same 8px as the top tape. The default is `top` for
  error and warning and `none` for info and success.
- **Animated.** `animated` moves the tape. Use it for an incident in
  progress. It stops under `prefers-reduced-motion: reduce`.
- **Pulse.** `pulse` makes the icon pulse. It is off by default, exists on
  loud only and stops under reduced motion.
- **Frames.** Pixel, manga and brush frames do not draw on a loud Alert, so
  the tape stays visible.

```tsx
<Alert variant="error" appearance="loud" onDismiss={clear}>
  <AlertContent>
    <AlertTitle>Database error</AlertTitle>
    <AlertDescription>storefront-demo.-.primary: connection refused</AlertDescription>
  </AlertContent>
  <AlertDetails>
    <div className="alert-body">Since 10:46 UTC. Affects reads on 3 branches.</div>
  </AlertDetails>
</Alert>
```

### Rich content

Label, Message and Meta work with every appearance. They match the loud
incident band best. Put structured context in AlertDetails: a `.kv` list of
facts, log lines in a `pre`, and the recovery actions in a `.row-wrap`.

```tsx
<Alert variant="error" appearance="loud" onDismiss={clear}>
  <AlertContent>
    <AlertLabel>Critical · Database error</AlertLabel>
    <AlertMessage>target: storefront-demo.-.primary: connection refused</AlertMessage>
    <AlertMeta>10:54:31 · storefront refusing requests</AlertMeta>
  </AlertContent>
  <AlertDetails>
    <div className="stack-sm">
      <dl className="kv">
        <dt>Request</dt><dd>req_8f2c41d07a</dd>
        <dt>Branches</dt><dd>main, preview-412, preview-418</dd>
      </dl>
      <pre>{`10:54:31.204 ERROR pool: connect storefront-demo.-.primary:5432 refused`}</pre>
      <div className="row-wrap">
        <Button size="sm" onClick={retry}>Retry</Button>
        <a href="/runbooks/database">Open the runbook</a>
      </div>
    </div>
  </AlertDetails>
</Alert>
```

Long text wraps inside the Alert, also an unbroken target such as a host name.
The description and the message stop at about 70 characters per line, so a
wide Alert keeps a readable line length. The icon, the Details button and
Dismiss stay at the top. Below 40rem, in every appearance, the Details button
and "+N" move to their own row under the text, so no button covers the text.
Dismiss stays at the top right.

### Overlay

`placement="overlay"` fixes the Alert to the top of the viewport, above every
layer (`z-index` 70), and it stays there while the page scrolls. React renders
it in a portal on `document.body`, so an app shell's stacking context cannot
hide it under the header. It works with
every appearance; a loud overlay is a full-width band. An overlay is always
opaque: tinted lays its tint over `--color-surface`, and it casts
`--shadow-lg` so it reads as above the page. Only one overlay Alert
shows at a time: a newer one replaces the visible one and shows "+1" for each
Alert waiting behind it. Dismissing the visible one shows the next. Use
overlay for a condition that affects the whole app, not one section.

Appearance does not change live-region behavior. Static documentation may use
`role="note"`; live conditions keep the severity's announcement semantics.
For rich descriptions, put paragraphs, lists and code inside a
`<div className="alert-body">` within AlertContent. AlertDescription itself
renders a paragraph, so do not nest paragraphs or lists inside it.

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

## Terminal

In a terminal, Alert is `tui-kiso` `Alert`: a `Card` with a tint of its
tone, the tone's glyph and the title in the tone's color, an optional text
and an optional action.

| Web | Terminal form |
| --- | --- |
| `default` | `○` and a neutral title. |
| `info` | `●`, title in `info`. |
| `success` | `✓`, title in `success`. |
| `warning` | `▲`, title in `warning`. |
| `danger` | `✕`, title in `danger`. |
| title | First row after the glyph, bold, in the tone's color. |
| description | Wrapped under the title in `foreground`, aligned with it. |
| action | A `Button` of size `sm` after a blank row. It is the only part that takes focus. |
| tint | 12% of the tone mixed into the card, in truecolor only. In 256 colors the card keeps its fill and the glyph and the title carry the tone. |
| label, message, meta | No own form. Put the label in the title and the message and meta in the text. |
| dismiss | No terminal form. The app clears the alert, for example with `Esc`. |
| loud | `.loud()`: the card filled with the tone's solid color and text in its solid foreground, one `▚` tape row on top in `tape`, no animation. `danger` uses `✕` and `warning` uses `▲`. |

Each tone has its own glyph, so color is never the only signal. The rail of
the `Look`, when there is one, stays `primary`: it marks the surface, not
the tone. `height` gives the rows the alert takes at a width, since the text
wraps. An alert has no keys of its own. For a short message that goes away,
use a [Toast](toast.md). See [terminal interfaces](../terminal-interfaces.md).

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
| Dismiss | Alert renders an [IconButton](icon-button.md) from `onDismiss`; shadcn has no dedicated dismiss slot |
| Details | Kiso `AlertDetails`, a disclosure; shadcn has no equivalent |
| Label, Message, Meta | Kiso `AlertLabel`, `AlertMessage`, `AlertMeta`; shadcn has no equivalent |
| `error` | shadcn `variant="destructive"` restyled to `--color-danger` (border/icon). Only `appearance="loud"` fills it with `--color-danger-solid` |
| `info` / `success` / `warning` | shadcn `default` plus the matching `--color-info`, `--color-success`, or `--color-warning` — **not** the shadcn "Custom Colors" utility-class example (`bg-amber-50`, etc.) |

Do **not** map this component to Radix
[Alert Dialog](https://www.radix-ui.com/primitives/docs/components/alert-dialog)
or shadcn Alert Dialog. Those are modal confirmation overlays (later slice:
Modal/Dialog). Using them here collapses the Alert vs Modal distinction.
