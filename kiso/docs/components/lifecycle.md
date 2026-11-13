# Lifecycle

## Purpose

Lifecycle is the header row of a detail screen: what the record is, what you
can do to it, and the one action you do not want to hit by accident. It sits
to the right of the [PageHeader](page-header.md) inside `.between`. See
[List-detail](../patterns/list-detail.md#list-and-detail-as-separate-screens).

## Anatomy

```
Lifecycle (.lifecycle)
├── status cluster (role="group", "Status"): one or more StatusBadge
├── verbs cluster (role="group", "Actions", optional): Buttons
└── destructive action (optional): Button with .btn-danger-ghost
```

```
[ Running │ HTTP 200 ]  [ Start │ Stop │ Restart ]    Remove
```

Status and verbs are two objects because they are different kinds of thing.
Each cluster gives its children's borders and corners to one frame, and a
hairline between children says they are separate readings or separate
choices. Status is read, so its cluster has no shadow and each badge keeps
its tone. The verbs are pressed, so their cluster carries the surface and the
shadow. The destructive action stands outside both with a wider gap, so a
slip on Restart cannot land on Delete.

## States

- **No verbs.** Pass no `actions` and the verbs cluster is not rendered. An
  empty bordered box reads as something that failed to load.
- **Disabled verb.** A disabled Button keeps its place in the cluster with the
  disabled surface. Start is off the whole time a thing runs; that is normal.
- **Work in progress.** The status cluster adds a pulsing
  [StatusBadge](status-badge.md) that names the phase.

## Sizes

Buttons are `size="sm"`; the clusters are `--size-control-sm` tall. At 720px
and below the status stays in the row and wraps its badges, each a separate
shape with its own border and corner treatment, a neutral one with the
standard border color, and the verbs and
the destructive action move into a bottom sheet behind a "More actions"
button. `actionsLabel` names the sheet; it defaults to "Actions". Picking an
enabled action closes the sheet. An action that opens a dialog, such as a
confirmation, leaves the sheet open under it, so a dialog the action renders
itself is not unmounted with the sheet.

## Accessibility

Each cluster is a `role="group"` named "Status" or "Actions". Every verb is
a text-labelled Button. The destructive action opens a confirmation; see
[Destructive actions](../patterns/destructive-actions.md). The focus ring of
a verb sits inside the cluster's edge.

## Tokens and implementation

Frames use `--color-border` and `--radius-md`; the verbs cluster uses
`--color-card` and `--shadow-xs`; hover uses `--color-accent-surface-hover`;
disabled uses `--color-disabled-surface` and `--color-disabled`. The
component takes slots, not data: the screen keeps its own conditions for
which verbs are disabled.

```tsx
<div className="between">
  <PageHeader><PageHeaderTitle>paperless</PageHeaderTitle></PageHeader>
  <Lifecycle
    status={<StatusBadge tone="success">Running</StatusBadge>}
    actions={<><Button size="sm">Stop</Button><Button size="sm">Restart</Button></>}
    destructive={<Button size="sm" variant="ghost" className="btn-danger-ghost">Remove</Button>}
  />
</div>
```

## Terminal

In a terminal, Lifecycle is `tui-kiso` `Lifecycle`: the header row of a
detail screen, in one row. It takes slots, as the web component does:
`StatusBadge`s, `Button`s and one destructive `Button`. It sets every
button to size `Sm`.

```
 ● Running  ○ HTTP 200     Stop │ Restart        Remove
```

| Part | Terminal form |
| --- | --- |
| status | `StatusBadge` pills, one space between them. |
| verbs | `Button` at size `Sm`, touching, with `│` in `border` between them. |
| destructive action | A `Button`, four columns after the verbs. Pass `Ghost` for a quiet one. |
| disabled verb | `ButtonState::Disabled`. It keeps its place. |
| no verbs | The verbs part is not drawn, and no gap stays. |
| work in progress | A `StatusBadge` with `pulse(true)` that names the phase. |

It draws from the left of its area, in one row; `Lifecycle::width` gives
the columns. A part that does not fit is left out whole, from the end, so
a narrow area loses Remove before the verbs. Below the status, show a
`DropdownMenu` for the verbs, as the web moves them to a sheet. The destructive
action opens a `Question` to confirm. This is the detail header, not the
steps of a run: use `StepList` for those. See
[terminal interfaces](../terminal-interfaces.md).
## When to use

- The header of a detail screen for a record with a state and verbs.

## When NOT to use

- A list screen. Its one primary verb goes in PageHeader `actions`.
- A create screen. There is nothing to start or delete yet.
- Row actions in a table. Use a [DropdownMenu](dropdown-menu.md).
