"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChartLegend, ChartSeriesLabel } from "./chart-legend.js"
import { ChartDot, ChartPattern, pixelCurve, useChartPresentation, useChartStyle, type ChartLayout, type ChartLegendPlacement, type ChartTreatmentProps } from "./chart-style.js"
import { useChartFill } from "./chart-fill.js"
import { chartColor, chartSlot, formatChartTime, formatChartValue, measured,
  validateChart, type ChartSample, type ChartSeries } from "./chart-data.js"

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
} & ChartTreatmentProps

export function Chart({ data, series, label, variant = "line", layout: layoutProp, legend: legendProp,
  highlightSeries, onHighlightSeriesChange, height: heightProp, syncId,
  formatTime = formatChartTime, formatValue = formatChartValue, min, max,
  chartStyle, chartLine, chartFill, ref, className, ...props }: ChartProps) {
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
  const [activeTimestamp, setActiveTimestamp] = React.useState<number | null>(null)
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
  const renderPlot = (indices: number[], lane?: ChartSeries) => <div className="chart-plot" style={{ height }}>
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={plot} syncId={(expanded.fill ? undefined : syncId) ?? (layout === "split" ? id : undefined)} syncMethod="value" accessibilityLayer
        aria-label={lane ? `${label}: ${lane.label}` : label} aria-describedby={`${id}-help`}
        margin={{ top: 8, right: 20, bottom: 0, left: 0 }}>
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
            onInspect={legend === "sidebar" && (!lane || indices[0] === 0) ? setActiveTimestamp : undefined} />} />
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
      </ComposedChart>
    </ResponsiveContainer>
  </div>
  const legendContent = <ChartLegend data={data} series={series} label={`${label}: summary`}
    variant={legend} formatValue={formatValue} formatTime={formatTime}
    activeTimestamp={legend === "sidebar" && hasData ? activeTimestamp : null}
    highlightSeries={highlighted} onHighlightSeriesChange={highlight} />
  return <figure {...props} ref={element => {
    frame.current = element
    if (typeof ref === "function") return ref(element)
    if (ref) ref.current = element
  }} data-slot="chart" data-layout={layout} data-legend={legend} data-line={line} data-fill={fill}
    className={cn("framed-chart", className)} aria-labelledby={`${id}-title`}>
    <figcaption id={`${id}-title`} className="t-h3">{label}</figcaption>
    <p id={`${id}-help`} className="chart-help">Focus the chart and use Left and Right to inspect samples. Select a series in the legend to highlight it. Exact values are available below.</p>
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
  return <div className="chart-inspection" role="status">
    <strong>{formatTime(sample.timestamp)}</strong>
    <dl>{series.map((item, index) => <React.Fragment key={item.key}>
      <dt><ChartSeriesLabel series={item} index={index} /></dt><dd>{displayValue(sample.values[item.key])}</dd>
    </React.Fragment>)}</dl>
  </div>
}
