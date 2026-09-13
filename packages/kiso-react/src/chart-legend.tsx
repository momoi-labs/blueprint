"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { chartColor, chartSlot, formatChartTime, formatChartValue, measured, seriesSummary, validateChart,
  type ChartSample, type ChartSeries } from "./chart-data.js"

export type ChartLegendProps = React.ComponentProps<"div"> & {
  data: readonly ChartSample[]
  series: readonly ChartSeries[]
  label: string
  formatValue?: (value: number) => string
  variant?: "table" | "inline" | "sidebar"
  activeTimestamp?: number | null
  formatTime?: (timestamp: number) => string
  highlightSeries?: string | null
  onHighlightSeriesChange?: (key: string | null) => void
}

export function ChartSeriesLabel({ series, index }: { series: ChartSeries; index: number }) {
  const slot = chartSlot(series, index)
  return <span className="chart-series-label">
    <svg aria-hidden="true" width="28" height="12" viewBox="0 0 28 12">
      <path d="M0 6H28" stroke={chartColor(slot)} strokeWidth="2" />
    </svg>
    <span>{slot}. {series.label}</span>
  </span>
}

export function ChartLegend({ data, series, label, formatValue = formatChartValue,
  variant = "table", activeTimestamp, formatTime = formatChartTime,
  highlightSeries, onHighlightSeriesChange, className, ...props }: ChartLegendProps) {
  validateChart(data, series)
  const seriesLabel = (item: ChartSeries, index: number) => onHighlightSeriesChange
    ? <button type="button" className="chart-series-button" aria-pressed={highlightSeries === item.key}
        onClick={() => onHighlightSeriesChange(highlightSeries === item.key ? null : item.key)}>
        <ChartSeriesLabel series={item} index={index} />
      </button>
    : <ChartSeriesLabel series={item} index={index} />
  if (variant !== "table") {
    const sample = activeTimestamp == null ? data.at(-1) : data.find(item => item.timestamp === activeTimestamp)
    return <div {...props} data-slot="chart-legend" data-variant={variant}
      className={cn("chart-legend", `chart-legend-${variant}`, className)} aria-label={label}
      aria-live={variant === "sidebar" ? "polite" : undefined}>
      <span className="chart-legend-caption">{variant === "sidebar" && activeTimestamp != null
        ? formatTime(activeTimestamp) : "Current"}</span>
      <dl>{series.map((item, index) => <div key={item.key}>
        <dt>{seriesLabel(item, index)}</dt>
        <dd>{measured(sample?.values[item.key]) ? formatValue(sample.values[item.key]!) : "Not collected"}</dd>
      </div>)}</dl>
    </div>
  }
  return <div {...props} data-slot="chart-legend" data-variant="table" className={cn("chart-table-scroll", className)}>
    <table className="chart-table">
      <caption>{label}</caption>
      <thead><tr><th scope="col">Series</th>{["Min", "Max", "Avg", "Current"].map(name => <th scope="col" key={name}>{name}</th>)}</tr></thead>
      <tbody>{series.map((item, index) => {
        const summary = seriesSummary(data, item.key)
        return <tr key={item.key}><th scope="row">{seriesLabel(item, index)}</th>
          {(["min", "max", "avg", "current"] as const).map(stat => <td key={stat}>
            {summary[stat] === null ? "Not collected" : formatValue(summary[stat])}
          </td>)}
        </tr>
      })}</tbody>
    </table>
  </div>
}
