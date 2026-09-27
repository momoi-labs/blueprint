# StatusBadge

## Purpose

StatusBadge says the state of one record in one of three tones, the way a
light on a device does. Green is alive: a running machine, a build that is
going, a run that ended well. Red is failed. Neutral is what is not
happening: pending, stopped, disabled. It is a [Badge](badge.md) with a
[Dot](dot.md); use Badge directly for classification that is not a state.

## Anatomy

```
StatusBadge (Badge)
├── Dot (decorative, pulses while work is going)
└── label (required)
```

## States

| Tone | Meaning | Badge variant |
| --- | --- | --- |
| `success` | Alive, or finished well. | `success` |
| `danger` | Failed. | `danger` |
| `neutral` | Not happening: pending, stopped, disabled. | `neutral` |

There is no fourth tone. "In progress" is not a colour: set `pulse` and let
the label name the phase ("Provisioning", "Building"), not "Running". A thing
that is merely up holds still.

## Sizes

One size, the Badge's. In a [Lifecycle](lifecycle.md) status cluster the
badge takes the cluster's height.

## Accessibility

The label carries the state; the dot is `aria-hidden`. Nothing depends on
colour alone. The pulse stops under `prefers-reduced-motion`, the same as
Dot's.

## Tokens and implementation

Tones map to Badge variants and reuse their tokens. The pulse is Dot's
`pulse`. No Radix primitive.

```tsx
<StatusBadge tone="success">Running</StatusBadge>
<StatusBadge tone="success" pulse>Provisioning</StatusBadge>
<StatusBadge tone="danger">Failed</StatusBadge>
<StatusBadge tone="neutral">Stopped</StatusBadge>
```

## When to use

- A record's state in a table cell or in a detail screen's Lifecycle row.

## When NOT to use

- Classification without a state ("Beta", "v2"). Use Badge.
- A warning or information state. Use Badge `warning` or `info`, or an
  [Alert](alert.md) when the person must act.
