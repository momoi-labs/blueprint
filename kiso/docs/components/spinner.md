# Spinner

An indeterminate loading indicator. It tells the person that work is
happening when the shape or duration of the result is not yet known.

## Purpose

Spinner is for *unknown* progress: a request has started, there is nothing
honest to draw yet, and the person must wait.

User story #22: Spinner is indeterminate; [Skeleton](skeleton.md) is
layout-preserving. If you already know the layout of what will appear
(table rows, a Card body, a form), use Skeleton. If you do not (a
submission, a reconnect, a short inline wait inside a Button), use Spinner.

## Anatomy

```
Spinner
├── graphic (required)
└── label (required in accessible name; visible when the wait is the
    primary thing on screen)
```

- **Graphic.** A circular (or otherwise looping) indicator. Color
  `--color-primary` on a track of `--color-border`. It is decorative once
  the name exists: the accessible name carries "Loading".
- **Label.** Visible text when Spinner is the main content of a region:
  "Loading queries…", "Connecting to database…". Follow
  [voice-and-tone](../voice-and-tone.md): state what is happening, no
  chatter. When Spinner is inside a Button, the Button label is the name
  ("Saving…") and the graphic has `aria-hidden="true"`.

## Variants

One visual variant. Meaning comes from placement, not color.

| Placement | Label |
| --- | --- |
| Inside [Button](button.md) / [IconButton](icon-button.md) | Button keeps a loading verb; graphic is decorative. |
| Inline next to a value or [Badge](badge.md) | Visible short word ("syncing") or `aria-label` on the Spinner. |
| Region / page | Visible label required. Centered in the region, not over unrelated chrome. |

Do not recolor Spinner to `--color-danger` to mean failed — a failed wait
is an [Alert](alert.md). Do not use `--color-success` to mean done — hide
the Spinner.

## Sizes

| Size | Scale | Use |
| --- | --- | --- |
| `sm` | Matches `--type-role-metadata` | Inside Button `sm`, Badge, inline meta. |
| `md` (default) | Matches `--type-role-label` | Inside Button `md`, IconButton `md`, inline waits. |
| `lg` | Matches `--type-role-body` | Region-level wait when layout is unknown. |

## States

| State | Behavior |
| --- | --- |
| default | Animating (unless reduced motion). |
| hover / focus / active | N/A. Spinner is not a control. |
| disabled | N/A. |
| loading | Spinner *is* the loading state of something else. It has no nested loading state. |
| error | Replace Spinner with [Alert](alert.md). Do not freeze a Spinner as an error cue. |

Motion uses `--motion-duration-normal` and `--motion-easing-standard` for
fade-in. The spin loop itself is continuous.

**Reduced motion:** the generated tokens set `--motion-duration-*` to `0s`
under `prefers-reduced-motion: reduce`. A spinning loop with duration zero
is invisible or broken. In that case show a **static** indicator (the same
graphic, not rotating) plus the label. Never communicate loading only with
motion.

## Accessibility

- When the Spinner is the only loading cue in a region: `role="status"`,
  `aria-live="polite"`, `aria-label` (or visible text) that says what is
  loading. `aria-busy="true"` on the region that is waiting.
- When composed inside a busy Button: the Button has `aria-busy="true"`;
  the graphic is `aria-hidden="true"` so "Loading" is not announced twice.
- Do not use `role="progressbar"` unless you have a real value. Spinner is
  indeterminate; a progress bar with no `aria-valuenow` is the wrong
  promise.
- Color is not the only cue; the label (visible or `aria-label`) is.

### Keyboard

No keymap. Focus stays on the control that started the wait (the Button),
or in the region if the whole view is replacing. Do not move focus to the
Spinner graphic.

## When to use

- A short, indeterminate wait: submitting a form, retrying a connection,
  refreshing one value.
- Inside a Button or IconButton loading state (user story #12).
- A region whose forthcoming layout is genuinely unknown (first paint of a
  custom view with no stable structure).

## When NOT to use

- **The layout is known.** [Skeleton](skeleton.md) — especially table rows,
  Card bodies, and form stacks. Table/DataTable (data slice) composes
  Skeleton for loading rows, not a Spinner over an empty table.
- **Progress is measurable** (percent, step n of m). Use a determinate
  progress pattern, not Spinner.
- **The wait is done or failed.** Hide Spinner; show content or Alert.
- **Decoration.** A never-ending Spinner next to idle content is a lie.
- **Blocking the whole app by default.** A page-level Spinner is a last
  resort when nothing else can render. Prefer Skeleton of the shell.

## Radix/shadcn mapping

No Radix Spinner primitive.

| Kiso | Reference |
| --- | --- |
| Graphic + `role="status"` + `aria-label="Loading"` | shadcn [Spinner](https://ui.shadcn.com/docs/components/spinner) |
| Inside Button | shadcn Button "Spinner" example, composed with Kiso Button loading rules |
| Size | shadcn size utilities restyled to the type-role matching sizes above, not arbitrary `size-*` pixels |

Replace shadcn's default icon color with `--color-primary`. Honor reduced
motion as specified above; do not rely on `animate-spin` alone.
