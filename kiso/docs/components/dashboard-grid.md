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
| `expandable` | `false` | Add an Expand control and the `V` shortcut. See [Expand](#expand). |

```tsx
const [layout, setLayout] = useStoredLayout("ops-dashboard")
<DashboardGrid aria-label="Operating system" layout={layout} onLayoutChange={setLayout}>
  <DashboardPanel id="cpu" title="CPU by state (%)" size={8} min={4} expandable>
    <Chart label="CPU by state (%)" … />
  </DashboardPanel>
  <DashboardPanel id="connections" title="Connections" size={4} min={3}>
    <Meter label="Connections" value={64} max={100} />
  </DashboardPanel>
</DashboardGrid>
```

## Expand

An expandable panel opens its content in a [Dialog](modal-dialog.md) that
fills the viewport, so the reader can study one chart in detail. Make a panel
expandable when its content gains from more room, such as a Chart.

- **Open.** The Expand control, an [IconButton](icon-button.md) with a
  maximize icon and an "Expand" Tooltip, sits last in the head. `V` opens it
  too; see [Shortcuts](#shortcuts).
- **Close.** `Escape`, `V`, or the Close button. Focus returns to the control
  that had it, or to the panel head when the pointer opened it.
- **Content.** The dialog title is the panel title and the body repeats the
  panel's content. A [Chart](chart.md) there takes the height the dialog
  leaves after its legend, and no longer synchronizes with the Charts on the
  grid. Focus starts on the chart plot, so Left and Right inspect samples at
  once.
- **Layout.** Expanding never writes to the layout. The grid stays mounted
  behind the scrim with its scroll position.

The dialog keeps a margin of `--spacing-lg` around it. At 640 pixels and below
it is edge to edge.

## Shortcuts

| Key | Result |
| --- | --- |
| `V` | Expand the panel that holds focus: its head or any control in it. A click on the head starts a move and does not focus it, so after the pointer moves, `V` expands the panel under the pointer instead. |
| `Escape` or `V` | Close the expanded panel. |

`V` does nothing while focus is in a text field, with a modifier key, or on a
panel that is not expandable. The Expand control names it with
`aria-keyshortcuts`; the control itself shows no key hint. List `V` in the
product's shortcut legend, under the dashboard; see
[Keyboard shortcuts](../patterns/keyboard-shortcuts.md).

## Sizes and responsive behavior

DashboardGrid follows its own width. Above 1024 pixels it uses twelve
columns. From 641 to 1024 pixels it uses six, and sizes are halved, rounding
up. At 640 pixels and below every panel spans one column. The compact scales
never write to the layout. Internal tables may scroll; the page must not
overflow.

## States and accessibility

Each widget owns its loading, empty, stale, and error states. Reserve its
space with Skeleton while loading. Moving, resizing, keyboard control and
focus follow [PaneGrid](pane-grid.md#accessibility); [Expand](#expand) adds
`V`. DOM order follows row
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
