# DashboardGrid

## Purpose and anatomy

Arrange metric panels on twelve columns. DashboardGrid is a
[PaneGrid](pane-grid.md) and DashboardPanel is a GridPane: the product seeds
each panel's size and row, and the reader moves and resizes panels. The
product persists the layout and restores it.

```
DashboardGrid
└── DashboardPanel: Head (title, actions), Body (Chart, Stat, Meter, BarGauge)
```

DashboardPanel is a [Card](card.md). Put the widget directly in the panel;
do not wrap it in another Card. A [Chart](chart.md) in a panel hides its own
caption visually, since the panel title names it. Give the chart the same
label as the panel, so assistive technology hears the same name.

## Props

DashboardGrid takes every PaneGrid prop: `layout`, `defaultLayout`,
`onLayoutChange`, `flow`, `overflow`, `fill`, `pack`, `scrollPages` and
`debug`. DashboardPanel takes every GridPane prop.

| Prop | Default | Contract |
| --- | --- | --- |
| `id` | required | Stable key in the saved layout. |
| `title` | required | Panel heading. Names the move and resize controls. |
| `size` | `6` | Width in columns of twelve when no layout is saved. |
| `min` | `1` | Narrowest width. |
| `newRow` | `false` | Start a row when no layout is saved. |

```tsx
const [layout, setLayout] = useStoredLayout("ops-dashboard")
<DashboardGrid aria-label="Operating system" layout={layout} onLayoutChange={setLayout}>
  <DashboardPanel id="cpu" title="CPU by state (%)" size={8} min={4}>
    <Chart label="CPU by state (%)" … />
  </DashboardPanel>
  <DashboardPanel id="connections" title="Connections" size={4} min={3}>
    <Meter label="Connections" value={64} max={100} />
  </DashboardPanel>
</DashboardGrid>
```

## Sizes and responsive behavior

DashboardGrid follows its own width. Above 1024 pixels it uses twelve
columns. From 641 to 1024 pixels it uses six, and sizes are halved, rounding
up. At 640 pixels and below every panel spans one column. The compact scales
never write to the layout. Internal tables may scroll; the page must not
overflow.

## States and accessibility

Each widget owns its loading, empty, stale, and error states. Reserve its
space with Skeleton while loading. Moving, resizing, keyboard control and
focus follow [PaneGrid](pane-grid.md#accessibility). DOM order follows row
order, so reading, focus and visual order agree. Give the grid an
`aria-label` or a `title`, and each panel a meaningful title.

## Tokens and composition

Gaps use `--presentation-grid-gap`. It resolves to `--spacing-lg` in the
default style and `--spacing-xl` in the editorial style. Panel padding uses
`--presentation-panel-padding`.
Compose [Chart](chart.md), [Stat](stat.md), [Meter](meter.md),
[BarGauge](bar-gauge.md), [Disclosure](disclosure.md), and
[TimeRangeControl](time-range-control.md) under the
[Dashboard pattern](../patterns/dashboard.md).
