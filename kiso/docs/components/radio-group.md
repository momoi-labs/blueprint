# RadioGroup

Selects one value from a small set of visible options. Selection does not
submit a form or advance a flow.

## Anatomy and API

`RadioGroup` provides the visible `label`, optional `description` and `error`,
and a Radix radio group. `RadioGroupItem` provides a `value`, visible `label`,
optional `description` and decorative `icon`.

```tsx
<RadioGroup label="Output format" name="format" value={format}
  onValueChange={setFormat} variant="tiles" controlSize="xl">
  <RadioGroupItem value="compact" label="Compact" description="A short summary." />
  <RadioGroupItem value="full" label="Full" description="Include all details." />
</RadioGroup>
```

## Variants and sizes

- `default`: standard radio indicators and labels, stacked.
- `tiles`: bordered options in a wrapping grid, with optional icons and notes.
- `segmented`: short options in a wrapping, recessed group.

`controlSize="md"` is the default. `xl` opts into 56px minimum targets and
18px labels. Tile height grows with its content. Long labels wrap.

## State and forms

Support `value` / `onValueChange` and `defaultValue`, group/item `disabled`,
`required`, `name` and native form participation through Radix. An `error`
sets the group's invalid state and connects its ValidationMessage.
Descriptions and errors retain supplied `aria-describedby` references.

The checked indicator, border and accessible state identify selection. Hover
is not selection. Disabled options cannot change the value. Pending saving
belongs to the surrounding form, which retains the selection.

## Accessibility

The visible label names the group. Each item has its own name and optional
description. A group is one tab stop; arrows move focus and selection among
enabled items. Space selects the focused item. Enter does not submit through
the radio. Native required validation and form reset follow Radix behavior.

Icons are decorative. Do not nest interactive content inside an option.
Use a separate Button to confirm. Immediate actions use Button's tile
presentation, which retains button semantics.

## Tokens

Use `--color-card`, `--color-foreground`, `--color-muted-foreground`,
`--color-border-strong`, `--color-link`, `--color-accent-surface`,
`--color-primary`, `--color-primary-foreground`, `--color-focus`,
`--color-danger` and `--color-disabled`. Sizes use `--size-control-md`,
`--size-control-xl`, `--size-touch-min` and `--size-icon-md`. Spacing uses
`--spacing-xs`, `--spacing-sm`, `--spacing-md` and `--spacing-lg`.

## When to use

Use when options should remain visible. Use Select for long lists, Checkbox
for independent choices and Tabs for panels. Behavior maps to the existing
Radix RadioGroup dependency. ThemeSelector keeps its own preference API.

## Appearance

With frame scope `all`, tiles use the same full border contour, corners and
corner marks as panels, including Pixel, Manga and Brush. Mark scope `outer`
removes their marks, as it does for panels. Default and segmented options
use the control contour, irregular under Manga and Brush. Scopes `panels` and `outer` retain standard
control corners. Pixel focus thickens the edge. Selected, error and disabled
states retain their semantic colors. Decoration does not clip content or
change the hit area.
