# Button

Triggers an in-page action. It does not change the URL.

## Purpose

Button is the control for *doing something*: submit a form, run a query, open
a dialog, save, delete. The person activates it; the application performs
behavior.

If the destination is a URL, use [Link](link.md). If the action is an icon
with no visible text, use [IconButton](icon-button.md).

### Choose the right control

| Need | Control | Why |
| --- | --- | --- |
| Trigger behavior (submit, save, delete, open) | **Button** | Action; URL does not change. |
| Icon-only action (toolbar, compact chrome) | **[IconButton](icon-button.md)** | Same as Button, but the accessible name is not visible text. |
| Go to a URL (in-app or external) | **[Link](link.md)** | Navigation; must remain a real link (open in new tab, copy URL). |

A Button that looks like a link is still a Button and is the wrong control for
navigation. A Link that looks like a Button is still a Link: visual style does
not change the semantics.

A Button may include an icon *plus* a text label. That is still Button, not
IconButton.

## Anatomy

```
Button
├── leading icon (optional)
├── label (required visible text)
├── trailing icon (optional)
└── Spinner (loading state only; replaces or precedes the label)
```

- **Label.** Direct verb phrase. Follow
  [voice-and-tone](../voice-and-tone.md): "Save query", "Delete replica",
  "Run". Not "Click here", not "Submit" when a specific verb exists.
- **Icon.** Optional reinforcement of the label. Never the only name — that
  is IconButton.
- **Spinner.** Only while the action is pending. See
  [Spinner](spinner.md).

## Variants

Four variants. Do not add a "link" variant; navigation is [Link](link.md).

| Variant | When | Tokens |
| --- | --- | --- |
| `default` | Secondary action on the current task. Most buttons. | Background `--color-card`, border `--color-input`, text `--color-foreground`, `--shadow-xs`. Hover background `--color-accent-surface`. |
| `primary` | The one action that advances the current task. At most one primary Button per region. | Background `--color-primary`, text `--color-primary-foreground`, transparent border, `--shadow-xs`. Hover background `--color-primary-hover`. |
| `destructive` | Irreversible or destructive action (delete, drop, disconnect). User story #4. | Background `--color-danger`, text `--color-danger-foreground`, transparent border, `--shadow-xs`. Match confirmation weight to stakes; see voice-and-tone. |
| `ghost` | Low-emphasis action in chrome, toolbars, or inside a Card. | Transparent background and border. Text `--color-muted-foreground`. Hover background `--color-accent-surface-hover`, text `--color-foreground`. |

`primary` and `destructive` are **solid fills**. The accent is the fill; the
label is `--color-primary-foreground` or `--color-danger-foreground`, which
inverts with the fill and is gated at 4.5:1 against it.

Do not render `primary` as an outline — accent text on a surface with an accent
border. That treatment reads as a secondary control, and in a violet system it
is what makes the primary action look grey.

If a destructive action is not irreversible (archive, disable, hide), use
`default` or `ghost`, not `destructive`.

## Sizes

Height comes from a control-size token, not from padding. Padding sets the inline
measure only.

| Size | Height | Type role | Inline padding | Radius | Use |
| --- | --- | --- | --- | --- | --- |
| `xs` | `--size-control-xs` | Label properties | `--spacing-sm` | `--radius-sm` | Inline row actions in dense tables. |
| `sm` | `--size-control-sm` | Label properties (`--type-role-label-font-family`, `--type-role-label-font-size`, `--type-role-label-font-weight`, `--type-role-label-letter-spacing`, `--type-role-label-line-height`) | `--spacing-md` | `--radius-md` | Toolbars, Card footers, compact filters. |
| `md` (default) | `--size-control-md` | Body properties | `--spacing-md` | `--radius-md` | Forms, page actions, dialogs. |
| `lg` | `--size-control-lg` | Body properties | `--spacing-lg` | `--radius-md` | Rare; empty-state or onboarding primary actions. |

`md` is 36px. It is **not** `--size-touch-min`: on a coarse pointer, add
`min-height: var(--size-touch-min)` inside `@media (pointer: coarse)` and leave
the desktop height alone. See [Accessibility](../accessibility.md#target-size).

Do not invent a fifth size. Page-level calls to action still use `md` or
`lg`. PageHeader (navigation slice) composes Buttons; it is not a Button
size.

## States

| State | Behavior | Tokens / notes |
| --- | --- | --- |
| default | Interactive. | Variant tokens above. |
| hover | Pointer over the control. | See variant hover. Cursor indicates affordance. Transition: `--motion-duration-fast` / `--motion-easing-standard`. |
| focus | Keyboard focus. | Visible ring using `--color-focus`. Never remove the ring without an equivalent. |
| active | Pointer down / activation. | Slightly pressed; keep the same semantic colors. |
| disabled | Interaction blocked. The person must see *that* it is blocked. User story #12. | Text and chrome `--color-disabled`. Not in the tab order (`disabled` on `<button>`). If the reason is not obvious from context, state it in adjacent copy — not inside a Tooltip. |
| loading | Interaction pending. User story #12. | `aria-busy="true"`. Show [Spinner](spinner.md); keep the original label or replace with a specific loading verb ("Saving…"). Ignore further activations. Do not swap loading for disabled: disabled means "cannot", loading means "working". |
| error | Not a Button state. | Failure belongs on [Alert](alert.md) or a field ValidationMessage, not on the Button. After failure, return the Button to default so the person can retry. |

Disabled is exempt from the AA text-contrast gate (`--color-disabled` is
intentionally outside it). Loading is not exempt: Spinner and remaining text
must still meet contrast.

## Accessibility

- Native `<button>` (or a component that renders one). Do not put
  `role="button"` on a link or a `div`.
- `type="button"` unless the Button submits a form (`type="submit"`) or
  resets it (`type="reset"`). A Button inside a form without an explicit
  type is a silent submit — that is a bug.
- Accessible name is the visible label. Do not override it with a different
  `aria-label`.
- Focus visible at all times using `--color-focus`.
- Disabled uses the native `disabled` attribute (removed from tab order).
  Loading may also set `disabled` to prevent double-submit; keep `aria-busy`
  so the pending state is announced.
- Icon + text: the icon is decorative (`aria-hidden="true"`); the text is the
  name.

### Keyboard

| Key | Action |
| --- | --- |
| `Enter` | Activate. |
| `Space` | Activate. |
| `Tab` / `Shift+Tab` | Move focus to the next / previous control. |

## When to use

- The person is causing an action: save, run, create, delete, confirm, retry.
- The action stays on this URL (including opening a dialog or drawer).
- Form submit and form-reset controls.
- PageHeader actions (title + subtitle + Buttons — composition lands in a
  later slice).

## When NOT to use

- **Navigation.** Anything that should change the URL, support open-in-new-tab,
  or be copyable as a link — use [Link](link.md), even if it is styled to look
  like a Button.
- **Icon with no text.** Use [IconButton](icon-button.md).
- **A row of mutually exclusive choices.** That is Tabs or a Select, not a
  Button group pretending to be navigation.
- **Toggling a boolean.** Use Switch or Checkbox (form primitives), not a
  Button whose label flips.
- **In-page warnings.** Use [Alert](alert.md) for the message; the Alert may
  *contain* a Button for recovery.

## Radix/shadcn mapping

There is no Radix Button primitive. Behavior is the native `<button>`.

| Kiso | Reference |
| --- | --- |
| Composition onto a child (rare; prefer a real `<button>`) | Radix [Slot](https://www.radix-ui.com/primitives/docs/utilities/slot) (`asChild`) |
| Visual system, sizes, variants | shadcn [Button](https://ui.shadcn.com/docs/components/button) |

Map Kiso variants onto shadcn *by intent*, not by name:

| Kiso variant | shadcn `variant` |
| --- | --- |
| `primary` | `outline`, restyled: `--color-primary` text and border, `--type-weight-semibold`. Do not use shadcn's filled `default` — that needs an on-primary text role Kiso does not have. |
| `default` | `outline` with `--color-foreground` / `--color-border` |
| `destructive` | `outline` restyled with `--color-danger` text and border, not filled `destructive` |
| `ghost` | `ghost` |

Do **not** use shadcn `variant="link"`. That style is [Link](link.md).

Do **not** use shadcn `size="icon"` here. That is [IconButton](icon-button.md).

shadcn's "As Link" / `buttonVariants` helper is valid when a *navigation*
control must *look* like a Button: apply the visual classes to a
[Link](link.md) (`<a>` / router link). Do not render `<button>` or a
component that forces `role="button"` for navigation.

Loading: compose shadcn Button with shadcn/Kiso [Spinner](spinner.md), as in
the shadcn Button "Spinner" example. Keep `aria-busy`.
