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
and below the row takes the width under the title, the verbs take a row of
their own, and the destructive action follows without its extra gap.

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

## When to use

- The header of a detail screen for a record with a state and verbs.

## When NOT to use

- A list screen. Its one primary verb goes in PageHeader `actions`.
- A create screen. There is nothing to start or delete yet.
- Row actions in a table. Use a [DropdownMenu](dropdown-menu.md).
