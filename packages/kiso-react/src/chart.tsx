"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { createPortal } from "react-dom"
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
  usePlotArea, useXAxisInverseDataSnapScale, useXAxisScale, useYAxisScale } from "recharts"
import { ChartLegend, ChartSeriesLabel } from "./chart-legend.js"
import { ChartDot, ChartPattern, pixelCurve, useChartPresentation, useChartStyle, type ChartLayout, type ChartLine, type ChartLegendPlacement, type ChartTreatmentProps } from "./chart-style.js"
import { useChartFill } from "./chart-fill.js"
import { chartPinned, clearChartPin, setChartHover, toggleChartPin, useChartSync } from "./chart-sync.js"
import { chartColor, chartSlot, formatChartTime, formatChartValue, measured,
  validateChart, type ChartSample, type ChartSeries, type ChartSummaryStat } from "./chart-data.js"
import type { TimeRange } from "./time-range-control.js"

export type { ChartSample, ChartSeries } from "./chart-data.js"
export type ChartProps = Omit<React.ComponentProps<"figure">, "children"> & {
  data: readonly ChartSample[]
  series: readonly ChartSeries[]
  label: string
  variant?: "line" | "stacked-area"
  /** Overrides the inherited data-chart-layout, otherwise standard. */
  layout?: ChartLayout
  /** Overrides the inherited data-chart-legend, otherwise table. */
  legend?: ChartLegendPlacement
  /** Columns of the table legend, in order. Default min, max, avg and current. */
  summary?: readonly ChartSummaryStat[]
  /** A controlled highlight. Pass null to clear it, or omit for local selection. */
  highlightSeries?: string | null
  onHighlightSeriesChange?: (key: string | null) => void
  height?: number
  /** Panels in a group inspect the same timestamp, not the same array index. */
  syncId?: string
  formatTime?: (timestamp: number) => string
  formatValue?: (value: number) => string
  min?: number
  max?: number
  /** Drag across the plot with a mouse or pen to select samples from one
      timestamp to another. TimeRangeControl stays the keyboard and touch path. */
  onRangeSelect?: (range: TimeRange) => void
} & ChartTreatmentProps

export function Chart({ data, series, label, variant = "line", layout: layoutProp, legend: legendProp, summary,
  highlightSeries, onHighlightSeriesChange, height: heightProp, syncId,
  formatTime = formatChartTime, formatValue = formatChartValue, min, max, onRangeSelect,
  chartStyle, chartLine, chartFill, ref, className, onKeyDown, ...props }: ChartProps) {
  const id = React.useId()
  const frame = React.useRef<HTMLElement>(null)
  const { line, fill } = useChartStyle(frame, { chartStyle, chartLine, chartFill })
  const presentation = useChartPresentation(frame, layoutProp, legendProp)
  const legend = presentation.legend
  // An inherited split cannot hold a stack, so a stacked chart keeps one plot.
  const layout = !layoutProp && presentation.layout === "split" && variant === "stacked-area" ? "standard" : presentation.layout
  const defaultHeight = layout === "compact" ? 165 : layout === "split" ? 90 : 200
  // In an expanded DashboardPanel the plot takes the room the dialog leaves.
  const expanded = useChartFill(frame, `${label}|${layout}|${legend}`, defaultHeight)
  const height = heightProp ?? expanded.height ?? defaultHeight
  const bold = line === "stepped" || line === "curved"
  const [localHighlight, setLocalHighlight] = React.useState<string | null>(null)
  // Charts with the same syncId share the inspected and pinned timestamps
  // through a Kiso store, not Recharts' syncId. An expanded Chart, or one
  // without a syncId, keeps a group of its own.
  const group = (expanded.fill ? undefined : syncId) ?? id
  const [source] = React.useState(() => ({}))
  const inspected = React.useRef<number | null>(null)
  const pick = React.useRef<ChartPick | null>(null)
  const inspect = React.useCallback((timestamp: number | null) => {
    inspected.current = timestamp
    setChartHover(group, source, timestamp)
  }, [group, source])
  React.useEffect(() => () => setChartHover(group, source, null), [group, source])
  // A drag moves the band in the DOM. Rendering the Chart on every pointer
  // move is far too slow for a stack of many series.
  const drag = React.useRef<{ from: number; to: number; x1: number; x2: number } | null>(null)
  const stopDrag = React.useRef<(() => void) | null>(null)
  React.useEffect(() => () => stopDrag.current?.(), [])
  const paintDrag = () => frame.current?.querySelectorAll<HTMLElement>(".chart-range-band").forEach(band => {
    const range = drag.current
    band.hidden = !range || range.from === range.to
    if (!range) return
    band.style.left = `${Math.min(range.x1, range.x2)}px`
    band.style.width = `${Math.abs(range.x2 - range.x1)}px`
  })
  const requestedHighlight = highlightSeries === undefined ? localHighlight : highlightSeries
  const highlighted = series.some(item => item.key === requestedHighlight) ? requestedHighlight : null
  const highlight = (key: string | null) => {
    if (highlightSeries === undefined) setLocalHighlight(key)
    onHighlightSeriesChange?.(key)
  }
  validateChart(data, series)
  if (layout === "split" && variant === "stacked-area") {
    throw new RangeError("Split layout requires line charts. Stacked areas share one plot.")
  }
  if (variant === "stacked-area" && data.some(sample => series.some(item => measured(sample.values[item.key]) && sample.values[item.key]! < 0))) {
    throw new RangeError("Stacked areas require nonnegative values. Use lines for signed data.")
  }
  if (!Number.isFinite(height) || height <= 0 || (min !== undefined && !Number.isFinite(min))
    || (max !== undefined && !Number.isFinite(max)) || (min !== undefined && max !== undefined && min >= max)) {
    throw new RangeError("Chart height must be positive and numeric bounds must be finite and ordered.")
  }
  // A partial stack has an unknown total. Omit the entire column rather than
  // drawing the missing contribution as zero. Tables retain the known values.
  const plot = data.map(sample => {
    const gap = variant === "stacked-area" && series.some(item => !measured(sample.values[item.key]))
    return { timestamp: sample.timestamp, values: series.map(item =>
      !gap && measured(sample.values[item.key]) ? sample.values[item.key] : null) }
  })
  const hasData = plot.some(sample => sample.values.some(measured))
  const displayValue = (value: number | null | undefined) => measured(value) ? formatValue(value) : "Not collected"
  const known = plot.flatMap(sample => sample.values).filter(measured)
  let splitMin = min ?? Math.min(0, ...known)
  let splitMax = max ?? Math.max(0, ...known)
  if (splitMin === splitMax) {
    if (max === undefined) splitMax += Math.max(1, Math.abs(splitMax) * 0.1)
    else splitMin -= Math.max(1, Math.abs(splitMin) * 0.1)
  }
  const sampleAt = (index: unknown) => typeof index === "number" ? plot[index]?.timestamp
    : typeof index === "string" && index !== "" ? plot[Number(index)]?.timestamp : undefined
  type Pointer = { activeTooltipIndex?: unknown; activeCoordinate?: { x: number } }
  const selectRange = onRangeSelect && plot.length > 1 ? onRangeSelect : undefined
  // A press that ends on the same sample is a click and pins that timestamp.
  // A press that moves to another sample is a drag and selects a range.
  const pointerHandlers = {
    onMouseDown: (state: Pointer, event: React.SyntheticEvent) => {
      const mouse = event as React.MouseEvent
      // A tap, or a click right after the pointer arrives, comes before
      // Recharts reads the pointer, so find the sample under it here.
      const active = sampleAt(state.activeTooltipIndex)
      const picked = active === undefined && mouse.currentTarget instanceof Element
        ? pick.current?.(mouse.clientX - mouse.currentTarget.getBoundingClientRect().left) : undefined
      const at = active ?? picked?.at, x = picked ? picked.x : state.activeCoordinate?.x
      if (at === undefined || x === undefined || mouse.button !== 0) return
      stopDrag.current?.()
      drag.current = { from: at, to: at, x1: x, x2: x }
      // The drag may end outside the plot, and Escape cancels it.
      const end = () => {
        const range = drag.current
        stop()
        if (!range) return
        if (range.from === range.to) toggleChartPin(group, range.from)
        else selectRange?.({ from: Math.min(range.from, range.to), to: Math.max(range.from, range.to) })
      }
      const cancel = (key: KeyboardEvent) => { if (key.key === "Escape") { key.preventDefault(); stop() } }
      const stop = () => {
        drag.current = null
        paintDrag()
        document.removeEventListener("mouseup", end)
        document.removeEventListener("keydown", cancel)
        stopDrag.current = null
      }
      document.addEventListener("mouseup", end)
      document.addEventListener("keydown", cancel)
      stopDrag.current = stop
    },
    onMouseMove: (state: Pointer) => {
      const at = sampleAt(state.activeTooltipIndex), x = state.activeCoordinate?.x
      if (!drag.current || at === undefined || x === undefined || at === drag.current.to) return
      drag.current = { ...drag.current, to: at, x2: x }
      if (selectRange) paintDrag()
    },
  }
  const renderPlot = (indices: number[], lane?: ChartSeries) => <div className="chart-plot" style={{ height }}
    data-range-select={selectRange ? "" : undefined}>
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={plot} syncId={layout === "split" ? id : undefined} syncMethod="value" accessibilityLayer
        aria-label={lane ? `${label}: ${lane.label}` : label} aria-describedby={`${id}-help`}
        margin={{ top: 8, right: 20, bottom: 0, left: 0 }} {...pointerHandlers}>
        <defs>{indices.map(index => <ChartPattern key={series[index]!.key} id={`${id}-fill-${index}`}
          color={chartColor(chartSlot(series[index]!, index))} fill={fill} />)}</defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeWidth={0.5} />
        <XAxis dataKey="timestamp" type="number" domain={["dataMin", "dataMax"]} scale="time"
          axisLine={false} tickLine={false} tickFormatter={formatTime} minTickGap={48}
          tick={{ fill: "var(--color-muted-foreground)" }} />
        <YAxis domain={layout === "split" ? [splitMin, splitMax]
          : [min ?? (variant === "stacked-area" ? 0 : "auto"), max ?? "auto"]}
          tickCount={3} axisLine={false} tickLine={false}
          tickFormatter={formatValue} tick={{ fill: "var(--color-muted-foreground)" }} width={56} />
        <Tooltip filterNull={false} isAnimationActive={false}
          cursor={{ stroke: "var(--color-border-strong)", strokeDasharray: "3 3" }}
          content={({ active, label: timestamp }) => <ChartReadout active={active}
            timestamp={Number(timestamp)} data={data} series={series} formatTime={formatTime}
            displayValue={displayValue} sidebar={legend === "sidebar"}
            onInspect={!lane || indices[0] === 0 ? inspect : undefined} />} />
        {indices.map(index => {
          const item = series[index]!
          const slot = chartSlot(item, index)
          const dimmed = highlighted !== null && item.key !== highlighted
          const common = { dataKey: `values.${index}`, name: item.label, stroke: chartColor(slot),
            strokeWidth: item.key === highlighted ? (bold ? 2.7 : 2.2) : bold ? 2 : 1.5,
            strokeOpacity: dimmed ? 0.3 : 1, strokeLinecap: line === "curved" ? "round" as const : "butt" as const,
            strokeLinejoin: line === "curved" ? "round" as const : "miter" as const,
            connectNulls: false, isAnimationActive: false,
            dot: (dotProps: { cx?: number; cy?: number; index?: number }) => {
              const at = dotProps.index ?? -1
              const isolated = measured(plot[at]?.values[index])
                && !measured(plot[at - 1]?.values[index]) && !measured(plot[at + 1]?.values[index])
              return <ChartDot key={at} cx={dotProps.cx} cy={dotProps.cy} r={isolated ? 3 : 0}
                line={line} fill={chartColor(slot)} opacity={dimmed ? 0.3 : 1} />
            }, activeDot: (dotProps: { cx?: number; cy?: number }) => <ChartDot {...dotProps}
              line={line} fill={chartColor(slot)} opacity={dimmed ? 0.3 : 1} /> }
          const curve = line === "stepped" ? pixelCurve : line === "curved" && variant === "line" ? "monotone" : "linear"
          // A stack needs an area even without a fill; it uses the tint.
          const textured = fill === "dots" || fill === "squares" || fill === "scanlines"
          return variant === "stacked-area" || fill !== "none"
            ? <Area key={item.key} {...common} type={curve} stackId={variant === "stacked-area" ? "total" : undefined}
                fill={textured ? `url(#${id}-fill-${index})` : chartColor(slot)}
                fillOpacity={dimmed ? 0.06 : 0.2} />
            : <Line key={item.key} {...common} type={curve} />
        })}
        <ChartSyncMarker group={group} source={source} plot={plot} data={data} series={series} indices={indices}
          stacked={variant === "stacked-area"} line={line} highlighted={highlighted} pick={!lane || indices[0] === 0 ? pick : undefined}
          readout={legend !== "sidebar" && (!lane || indices[0] === 0)} formatTime={formatTime} displayValue={displayValue} />
      </ComposedChart>
    </ResponsiveContainer>
    {selectRange && <div className="chart-range-band" hidden aria-hidden="true" />}
  </div>
  const legendProps = { data, series, label: `${label}: summary`, variant: legend, summary, formatValue, formatTime,
    highlightSeries: highlighted, onHighlightSeriesChange: highlight }
  // Only a sidebar follows the inspected timestamp, so only it subscribes.
  const legendContent = legend === "sidebar"
    ? <ChartSidebarLegend group={group} {...legendProps} />
    : <ChartLegend {...legendProps} />
  return <figure {...props} ref={element => {
    frame.current = element
    if (typeof ref === "function") return ref(element)
    if (ref) ref.current = element
  }} data-slot="chart" data-layout={layout} data-legend={legend} data-line={line} data-fill={fill}
    className={cn("framed-chart", className)} aria-labelledby={`${id}-title`} onKeyDown={event => {
      onKeyDown?.(event)
      if (event.defaultPrevented || drag.current) return
      if (event.key === "Escape" && chartPinned(group) !== null) {
        event.preventDefault()
        clearChartPin(group)
      } else if ((event.key === "Enter" || event.key === " ") && inspected.current !== null
        && event.target instanceof Element && event.target.closest(".chart-plot")) {
        event.preventDefault()
        toggleChartPin(group, inspected.current)
      }
    }}>
    <figcaption id={`${id}-title`} className="t-h3">{label}</figcaption>
    <p id={`${id}-help`} className="chart-help">Focus the chart and use Left and Right to inspect samples. Press Enter to mark the inspected sample in every synchronized chart, and Escape to clear it. Select a series in the legend to highlight it. Exact values are available below.</p>
    <div className="chart-body">
      <div className="chart-plots">
        {hasData ? layout === "split" ? series.map((item, index) => <div className="chart-lane" key={item.key}>
          <div className="chart-lane-heading"><ChartSeriesLabel series={item} index={index} />
            <span>{displayValue(data.at(-1)?.values[item.key])}</span></div>
          {renderPlot([index], item)}
        </div>) : renderPlot(series.map((_, index) => index))
          : <div className="chart-empty hatch" style={{ minHeight: height }}>No collected samples in this window.</div>}
      </div>
      {legend === "sidebar" && legendContent}
    </div>
    {legend !== "sidebar" && legendContent}
    <details className="disclosure chart-values">
      <summary>View exact values</summary>
      <div className="chart-table-scroll"><table className="chart-table">
        <caption>{label}: collected samples, timestamps in UTC</caption>
        <thead><tr><th scope="col">Timestamp</th>{series.map(item => <th scope="col" key={item.key}>{item.label}</th>)}</tr></thead>
        <tbody>{data.map(sample => <tr key={sample.timestamp}><th scope="row">{formatChartTime(sample.timestamp)}</th>
          {series.map(item => <td key={item.key}>{measured(sample.values[item.key]) ? String(sample.values[item.key]) : "Not collected"}</td>)}
        </tr>)}</tbody>
      </table></div>
    </details>
  </figure>
}

// Observe Recharts' synchronized tooltip state after render. This keeps the
// sidebar on the same timestamp for mouse, keyboard, touch, and sibling panels.
function ChartReadout({ active, timestamp, data, series, formatTime, displayValue, sidebar, onInspect }: {
  active: boolean
  timestamp: number
  data: readonly ChartSample[]
  series: readonly ChartSeries[]
  formatTime: (timestamp: number) => string
  displayValue: (value: number | null | undefined) => string
  sidebar: boolean
  onInspect?: (timestamp: number | null) => void
}) {
  const sample = active ? data.find(item => item.timestamp === timestamp) : undefined
  const inspectedTimestamp = sample?.timestamp ?? null
  React.useEffect(() => { onInspect?.(inspectedTimestamp) }, [onInspect, inspectedTimestamp])
  if (!sample || sidebar) return null
  return <ChartInspection role="status" sample={sample} series={series} formatTime={formatTime} displayValue={displayValue} />
}

function ChartInspection({ sample, series, formatTime, displayValue, className, ...props }: React.ComponentProps<"div"> & {
  sample: ChartSample
  series: readonly ChartSeries[]
  formatTime: (timestamp: number) => string
  displayValue: (value: number | null | undefined) => string
}) {
  return <div {...props} className={cn("chart-inspection", className)}>
    <strong>{formatTime(sample.timestamp)}</strong>
    <dl>{series.map((item, index) => <React.Fragment key={item.key}>
      <dt><ChartSeriesLabel series={item} index={index} /></dt><dd>{displayValue(sample.values[item.key])}</dd>
    </React.Fragment>)}</dl>
  </div>
}

type PlotSample = { timestamp: number; values: (number | null | undefined)[] }
type ChartPick = (x: number) => { at: number; x: number } | undefined

// The other Charts of a group mark the inspected timestamp with a line and
// dots, and a pinned timestamp with a solid line and its values. This
// subtree alone renders on hover; the plot, legend, and tables do not.
function ChartSyncMarker({ group, source, plot, data, series, indices, stacked, line, highlighted, pick, readout, formatTime, displayValue }: {
  group: string
  source: object
  plot: readonly PlotSample[]
  data: readonly ChartSample[]
  series: readonly ChartSeries[]
  indices: readonly number[]
  stacked: boolean
  line: ChartLine
  highlighted: string | null
  pick?: React.RefObject<ChartPick | null>
  readout: boolean
  formatTime: (timestamp: number) => string
  displayValue: (value: number | null | undefined) => string
}) {
  const { hover, source: hovering, pinned } = useChartSync(group)
  const xScale = useXAxisScale(), yScale = useYAxisScale(), area = usePlotArea(), snap = useXAxisInverseDataSnapScale()
  React.useLayoutEffect(() => {
    if (!pick) return
    pick.current = x => {
      const at = area && x >= area.x && x <= area.x + area.width ? snap?.(x) : undefined
      const snapped = typeof at === "number" ? xScale?.(at) : undefined
      return typeof at === "number" && snapped !== undefined ? { at, x: snapped } : undefined
    }
  }, [pick, area, snap, xScale])
  const mark = React.useRef<SVGGElement>(null)
  const [layer, setLayer] = React.useState<HTMLElement | null>(null)
  React.useLayoutEffect(() => setLayer(mark.current?.closest<HTMLElement>(".chart-plot") ?? null), [])
  const place = (timestamp: number | null) => {
    if (timestamp === null || !xScale || !area) return undefined
    const sample = plot.find(item => item.timestamp === timestamp)
    const x = sample && xScale(timestamp)
    return sample && x !== undefined && Number.isFinite(x) ? { sample, x } : undefined
  }
  const drawn = place(hovering === source ? null : hover), held = place(pinned)
  const marker = (at: { sample: PlotSample; x: number }, dash?: string) => <g>
    <line x1={at.x} x2={at.x} y1={area!.y} y2={area!.y + area!.height} stroke="var(--color-border-strong)"
      strokeWidth={dash ? 1 : 1.5} strokeDasharray={dash} />
    {yScale && indices.map(index => {
      const value = at.sample.values[index]
      if (!measured(value)) return null
      const total = stacked ? at.sample.values.slice(0, index + 1).reduce<number>((sum, item) => sum + (item ?? 0), 0) : value
      const y = yScale(total)
      const item = series[index]!
      return y === undefined ? null : <ChartDot key={item.key} cx={at.x} cy={y} line={line} fill={chartColor(chartSlot(item, index))}
        opacity={highlighted !== null && item.key !== highlighted ? 0.3 : 1} />
    })}
  </g>
  // The hovered Chart shows its own readout, so its pinned one steps aside.
  const pinnedSample = readout && held && !(hovering === source && hover !== null)
    ? data.find(item => item.timestamp === held.sample.timestamp) : undefined
  const flip = held && area ? held.x > area.x + area.width / 2 : false
  return <g ref={mark} className="chart-sync-marker" pointerEvents="none">
    {held && marker(held)}
    {drawn && marker(drawn, "3 3")}
    {layer && pinnedSample && held && area && createPortal(<ChartInspection className="chart-pin-readout" sample={pinnedSample}
      series={series} formatTime={formatTime} displayValue={displayValue}
      style={{ top: area.y, left: flip ? held.x - 12 : held.x + 12, translate: flip ? "-100%" : undefined }} />, layer)}
  </g>
}

function ChartSidebarLegend({ group, data, ...props }: React.ComponentProps<typeof ChartLegend> & { group: string }) {
  const { hover, pinned } = useChartSync(group)
  const activeTimestamp = [hover, pinned].find(timestamp => timestamp !== null
    && data.some(sample => sample.timestamp === timestamp)) ?? null
  return <ChartLegend {...props} data={data} activeTimestamp={activeTimestamp} />
}
