# Badge

A small inline status label. Not a button, not a card, not a count of
notifications by itself.

## Purpose

Badge names a state or classification next to something else: "New",
"Beta", "live", "primary", "read replica". It is read, not clicked.

User story #18: Badge is for status labels; [Card](card.md) is for grouping
related content.

If the person must act on the status, pair the Badge with a
[Button](button.md) / [Link](link.md). Do not make the Badge the control.

## Anatomy

```
Badge
├── leading icon or dot (optional)
├── label (required)
└── trailing icon (optional; rarely needed)
```

- **Label.** One or two words. Lowercase product nouns are fine ("live",
  "beta"); proper names keep their form. Follow
  [voice-and-tone](../voice-and-tone.md): direct, no filler.
- **Dot / icon.** Optional severity or category cue. Decorative
  (`aria-hidden="true"`) when the label already says the state. If the Badge
  is icon-only (avoid this), it needs `aria-label`.
- **No dismiss control.** A dismissible status is an [Alert](alert.md) or a
  filter chip (not in this slice). Badge is not closable.

## Variants

Variants encode *meaning*, using status and foreground roles. Do not invent
ad-hoc colors.

| Variant | Meaning | Tokens |
| --- | --- | --- |
| `neutral` (default) | Classification without severity: "Beta", "read", "v2". | Text `--color-foreground`, background `--color-surface`, border `--color-border`. |
| `info` | Informational state: "New", "preview". | Text `--color-info`, border `--color-info`, background `--color-surface`. |
| `success` | Healthy / complete: "live", "connected", "healthy". | Text `--color-success`, border `--color-success`, background `--color-surface`. |
| `warning` | Needs attention: "degraded", "stale". | Text `--color-warning`, border `--color-warning`, background `--color-surface`. |
| `danger` | Failed / blocked: "down", "unhealthy". | Text `--color-danger`, border `--color-danger`, background `--color-surface`. |

Fill stays `--color-surface` so the status color is the text and border.
That keeps contrast on the AA gate (status roles are checked against
`surface`). Do not paint the whole Badge `--color-danger` and then guess a
foreground.

Do not add a `primary` Badge to shout marketing emphasis. If the thing is
the main object, that is typography and hierarchy, not a Badge.

An optional `outline` look is `neutral` with transparent background — still
`--color-border`, not a new variant.

## Sizes

| Size | Type role | Padding | Radius |
| --- | --- | --- | --- |
| `sm` (default) | `--type-role-metadata` | `--spacing-xs` | `--radius-sm` |
| `md` | `--type-role-label` | `--spacing-xs` block, `--spacing-sm` inline | `--radius-sm` |

Do not use `--radius-full` (pill). Badges are compact labels, not tags in
a marketing cluster.

## States

Badge is not interactive by default.

| State | Behavior |
| --- | --- |
| default | Static label. |
| hover / focus / active | None, unless the Badge is wrapped by a Link (see below). |
| disabled | N/A. Hide a Badge that no longer applies; do not grey it. |
| loading | Optional: replace the label with a tiny [Spinner](spinner.md) plus a word ("syncing"). Prefer Skeleton on the parent region if the whole status is unknown. |
| error | Use `danger` as the *meaning*, not a separate error state. |

If a Badge is a Link (filter that navigates to a tagged view), the Link is
the interactive element: Badge provides appearance only. Focus ring
`--color-focus` on the Link. Do not put `onClick` on a `span` Badge.

## Accessibility

- Default element: `<span>`. No `role="status"` on every Badge — that would
  shout every "Beta" as a live region. The surrounding content already
  includes the object; the Badge is extra words in that name.
- If the Badge is the only indication of a *changing* live state that the
  person must notice (connection dropped), the *region* should update via
  [Alert](alert.md) or `aria-live`, not a silent Badge swap.
- Color is not the only cue: the label text carries the meaning. A red
  empty Badge is a fail.
- Icon-only: `aria-label` required. Prefer text.

### Keyboard

No keymap. A Badge that is a Link follows [Link](link.md) keyboard rules.

## When to use

- A short status or classification next to a title, table cell, or Card
  title: "New", "Beta", "live", "primary".
- Several orthogonal labels ("live" + "read replica") — each is its own
  Badge, not one concatenated string.

## When NOT to use

- **Grouping content.** [Card](card.md).
- **In-page warnings with explanation and recovery.** [Alert](alert.md).
- **Actions.** Buttons, IconButtons, and Links. A "Delete" Badge is a
  mistake.
- **Counts, notifications, or numeric attention dots.** If Kiso needs a
  notification count later, that is not this component. A numeric "3" Badge
  on an icon is chrome, not a status label.
- **Section headings or filters that look like a pile of pills.** Filters
  are Controls; they belong with Input/Select or a later pattern.
- **Long sentences.** If it needs punctuation, it is copy, not a Badge.

## Radix/shadcn mapping

No Radix Badge primitive. Visual reference: shadcn
[Badge](https://ui.shadcn.com/docs/components/badge).

| Kiso | shadcn |
| --- | --- |
| `neutral` | `secondary` or `outline` restyled to `--color-surface` / `--color-border` / `--color-foreground` |
| `info` / `success` / `warning` / `danger` | Do not use arbitrary `bg-green-*` utilities from the shadcn "Custom Colors" example. Map to `--color-info|success|warning|danger` |
| shadcn `destructive` | Closest to Kiso `danger` |
| shadcn `default` (accent fill) | Do not use as a status; it competes with primary actions |
| shadcn `variant="link"` | Do not use; navigation is [Link](link.md) |

If the Badge navigates, compose shadcn Badge visuals on an `<a>` the same
way Button-look Links do — do not use a Button.
