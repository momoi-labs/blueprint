export type ChartSample = {
  /** Epoch milliseconds. Include every expected timestamp, including gaps. */
  timestamp: number
  values: Readonly<Record<string, number | null>>
}

export type ChartSeries = {
  key: string
  label: string
  /** Stable identity across panels. Defaults to its position, starting at 1. */
  slot?: number
}

export const chartStrokes = [undefined, "8 4", "2 3", "8 3 2 3", "12 3 2 3 2 3"] as const
export const chartSlot = (series: ChartSeries, index: number) => series.slot ?? index + 1
/* Slots 1 to 5 use the validated palette. Later slots get a generated
   color in the palette's lightness band for each theme. The first four take
   the hues between the palette's own (magenta, teal, lime, orange); after
   that the hue turns by the golden angle and the lightness alternates.
   Generated colors are not checked for color-vision deficiency, so the
   numbered label and exact values carry identity. */
const gapHues = [330, 195, 115, 50]
export const chartColor = (slot: number) => {
  if (slot <= 5) return `var(--color-chart-${slot})`
  const extra = slot - 6
  const hue = gapHues[extra] ?? Math.round((gapHues[0]! + extra * 137.508) % 360)
  const shift = extra >= gapHues.length && extra % 2 ? 0.08 : 0
  return `light-dark(oklch(${0.55 - shift} 0.13 ${hue}), oklch(${0.8 + shift} 0.12 ${hue}))`
}
export const measured = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value)

export function validateChart(data: readonly ChartSample[], series: readonly ChartSeries[]) {
  if (series.length < 1) throw new RangeError("Charts require at least one series.")
  const keys = new Set<string>()
  const slots = new Set<number>()
  series.forEach((item, index) => {
    const slot = chartSlot(item, index)
    if (!item.key || !item.label || keys.has(item.key) || slots.has(slot) || slot < 1 || !Number.isInteger(slot)) {
      throw new RangeError("Chart series require unique keys, positive integer slots, and labels.")
    }
    keys.add(item.key)
    slots.add(slot)
  })
  data.forEach((sample, index) => {
    if (!Number.isFinite(sample.timestamp) || Math.abs(sample.timestamp) > 8.64e15 || (index > 0 && sample.timestamp <= data[index - 1]!.timestamp)) {
      throw new RangeError("Chart timestamps must be finite and strictly increasing.")
    }
  })
}

export type ChartSummaryStat = "min" | "max" | "avg" | "current" | "p50" | "p75" | "p90" | "p95" | "p99"
export const chartSummaryStats: readonly ChartSummaryStat[] = ["min", "max", "avg", "current", "p50", "p75", "p90", "p95", "p99"]
export const defaultChartSummary: readonly ChartSummaryStat[] = ["min", "max", "avg", "current"]
export const chartSummaryLabel = (stat: ChartSummaryStat) =>
  stat.startsWith("p") ? stat : stat[0].toUpperCase() + stat.slice(1)

/** Linear interpolation between the closest ranks of sorted values. */
function percentile(sorted: readonly number[], fraction: number) {
  const rank = (sorted.length - 1) * fraction
  const low = Math.floor(rank)
  const high = Math.ceil(rank)
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low)
}

export function seriesSummary(data: readonly ChartSample[], key: string,
  stats: readonly ChartSummaryStat[] = defaultChartSummary) {
  const unknown = stats.find(stat => !chartSummaryStats.includes(stat))
  if (unknown) throw new Error(`Unknown chart summary column: ${unknown}`)
  const values = data.map(sample => sample.values[key]).filter(measured)
  const sorted = [...values].sort((a, b) => a - b)
  const value = (stat: ChartSummaryStat): number | null => {
    if (stat === "current") return measured(data.at(-1)?.values[key]) ? data.at(-1)!.values[key]! : null
    if (!values.length) return null
    if (stat === "min") return sorted[0]
    if (stat === "max") return sorted.at(-1)!
    if (stat === "avg") return values.reduce((sum, item) => sum + item / values.length, 0)
    return percentile(sorted, Number(stat.slice(1)) / 100)
  }
  return Object.fromEntries(stats.map(stat => [stat, value(stat)])) as Record<ChartSummaryStat, number | null>
}

export const formatChartTime = (timestamp: number) => new Date(timestamp).toISOString()
export const formatChartValue = (value: number) => String(value)
