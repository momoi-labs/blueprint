# Steps

Shows position in a bounded guided flow. The caller owns validation,
completion and navigation.

## Anatomy and API

`Steps` renders a named `nav`, an ordered list, a marker, a label, state text
and optional supporting text for each item. Connectors are decorative and stop before each marker; they never cross an icon.

```tsx
<Steps label="Setup progress" current="options" orientation="vertical"
  items={[
    { id: "source", label: "Source", status: "completed", navigable: true },
    { id: "options", label: "Options" },
    { id: "review", label: "Review", status: "disabled" },
  ]}
  onStepChange={setCurrent}
/>
```

Each `StepsItem` has a stable `id`, `label`, optional `description`, `status`,
`navigable` and `href`. `current` is independent of status, so a current step
can also contain an error. Never infer completion from position.

## Layout

`orientation` is `horizontal` by default or `vertical`. With `responsive`
(the default), containers at most 36rem wide show a compact count, current
label, segments and a View steps button. That button reveals the same full
list, including available navigation. `responsive={false}` keeps the full
list, including in a narrow vertical rail. Labels wrap.

There is no fixed step count. An empty list shows no invented progress.
Without a current item, the compact summary says either all steps completed
or no current step. The `labels` prop localizes state names, disclosure labels
and the `position(position, total)` formatter.

## States and navigation

| State | Behavior |
| --- | --- |
| upcoming | Muted label and dashed marker; work has not been completed. |
| current | The item matching `current` has `aria-current="step"`. |
| completed | A check marker and completed text identify finished work. |
| error | An exclamation marker and state text identify work needing attention. |
| disabled | Muted label and lock marker; cannot navigate, even with a callback or URL. |

A supplied `href` creates a native link. Otherwise, `navigable: true` and
`onStepChange` create a button. Other items remain text. There is no automatic
advance and no persistence. Back and Continue belong outside the indicator.

## Accessibility

Provide a visible context and a meaningful navigation `label`. Only links and
buttons join the tab order. Enter activates links; Enter and Space activate
buttons. Do not add arrow-key navigation. The compact disclosure exposes
`aria-expanded` and `aria-controls`; the collapsed list leaves the tab order.

After navigation, the caller focuses the next heading. Error text must explain
what to fix. Current, error and completed states do not rely on color alone.

## Tokens

Use `--size-control-md` for markers, `--size-icon-md` for checks,
`--color-primary` with `--color-primary-foreground` for current markers,
`--color-link` for their boundary, `--color-danger` with
`--color-danger-surface` for errors, `--color-foreground` and
`--color-background` for completed markers, and `--color-border` for
pending connectors. Pending and unavailable labels use `--color-muted-foreground`
to reduce emphasis without fading readable text. Spacing uses `--spacing-xs`, `--spacing-sm`, `--spacing-md` and
`--spacing-lg`. Labels use body typography and `--type-weight-semibold`.

## When to use

Use for a finite input flow. Use Pagination for dataset pages and StepList or
StepBar for a run's progress. There is no Radix primitive for Steps; keep
native list, link and button semantics.

## Appearance

With frame scope `all`, markers follow the shared control corners and sizes,
including Pixel, Rounded and Asymmetric. Manga and Brush use the compact
control outline. Pending Pixel edges remain dashed; check, error and lock
symbols retain their state colors. Scopes `panels` and `outer` keep the default
circular markers. Appearance does not change navigation or completion.
