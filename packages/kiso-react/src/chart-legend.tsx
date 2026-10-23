"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { chartColor, chartSlot, defaultChartSummary, formatChartTime, formatChartValue,
  measured, seriesSummary, validateChart, type ChartSample, type ChartSeries, type ChartSummaryStat } from "./chart-data.js"

export type { ChartSummaryStat } from "./chart-data.js"

const defaultLabels = {
  series: "Series", current: "Current", notCollected: "Not collected",
  min: "Min", max: "Max", avg: "Avg", p50: "p50", p75: "p75", p90: "p90", p95: "p95", p99: "p99",
}

export type ChartLegendProps = React.ComponentProps<"div"> & {
  data: readonly ChartSample[]
  series: readonly ChartSeries[]
  label: string
  formatValue?: (value: number) => string
  variant?: "table" | "inline" | "sidebar"
  /** Columns of the table legend, in order. The inline and sidebar legends ignore it. */
  summary?: readonly ChartSummaryStat[]
  activeTimestamp?: number | null
  formatTime?: (timestamp: number) => string
  highlightSeries?: string | null
  onHighlightSeriesChange?: (key: string | null) => void
  /** Localizes the fixed text. `current` names both the current column and the inline caption. */
  labels?: Partial<typeof defaultLabels>
}

export function ChartSeriesLabel({ series, index }: { series: ChartSeries; index: number }) {
  const slot = chartSlot(series, index)
  return <span className="chart-series-label">
    <svg className="chart-series-swatch" aria-hidden="true" width="28" height="12" viewBox="0 0 28 12">
      <path d="M0 6H28" stroke={chartColor(slot)} strokeWidth="2" />
    </svg>
    <span>{slot}. {series.label}</span>
  </span>
}

export function ChartLegend({ data, series, label, formatValue = formatChartValue,
  variant = "table", summary: stats = defaultChartSummary, activeTimestamp, formatTime = formatChartTime,
  highlightSeries, onHighlightSeriesChange, labels, className, ...props }: ChartLegendProps) {
  validateChart(data, series)
  const text = { ...defaultLabels, ...labels }
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
        ? formatTime(activeTimestamp) : text.current}</span>
      <dl>{series.map((item, index) => <div key={item.key}>
        <dt>{seriesLabel(item, index)}</dt>
        <dd>{measured(sample?.values[item.key]) ? formatValue(sample.values[item.key]!) : text.notCollected}</dd>
      </div>)}</dl>
    </div>
  }
  return <div {...props} data-slot="chart-legend" data-variant="table" className={cn("chart-table-scroll", className)}>
    <table className="chart-table">
      <caption>{label}</caption>
      <thead><tr><th scope="col">{text.series}</th>{stats.map(stat => <th scope="col" key={stat}>{text[stat]}</th>)}</tr></thead>
      <tbody>{series.map((item, index) => {
        const summary = seriesSummary(data, item.key, stats)
        return <tr key={item.key}><th scope="row">{seriesLabel(item, index)}</th>
          {stats.map(stat => <td key={stat}>
            {summary[stat] === null ? text.notCollected : formatValue(summary[stat])}
          </td>)}
        </tr>
      })}</tbody>
    </table>
  </div>
}
