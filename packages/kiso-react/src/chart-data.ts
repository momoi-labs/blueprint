export type ChartSample = {
  /** Epoch milliseconds. Include every expected timestamp, including gaps. */
  timestamp: number
  values: Readonly<Record<string, number | null>>
}

export type ChartSeries = {
  key: string
  label: string
  /** Stable identity across panels. Defaults to its position, starting at 1. */
  slot?: 1 | 2 | 3 | 4 | 5
}

export const chartStrokes = [undefined, "8 4", "2 3", "8 3 2 3", "12 3 2 3 2 3"] as const
export const chartSlot = (series: ChartSeries, index: number) => series.slot ?? index + 1
export const chartColor = (slot: number) => `var(--color-chart-${slot})`
export const measured = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value)

export function validateChart(data: readonly ChartSample[], series: readonly ChartSeries[]) {
  if (series.length < 1 || series.length > 5) throw new RangeError("Charts require one to five series.")
  const keys = new Set<string>()
  const slots = new Set<number>()
  series.forEach((item, index) => {
    const slot = chartSlot(item, index)
    if (!item.key || !item.label || keys.has(item.key) || slots.has(slot) || slot < 1 || slot > 5 || !Number.isInteger(slot)) {
      throw new RangeError("Chart series require unique keys, slots from 1 to 5, and labels.")
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

export function seriesSummary(data: readonly ChartSample[], key: string) {
  const values = data.map(sample => sample.values[key]).filter(measured)
  return {
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    avg: values.length ? values.reduce((sum, value) => sum + value / values.length, 0) : null,
    current: measured(data.at(-1)?.values[key]) ? data.at(-1)!.values[key]! : null,
  }
}

export const formatChartTime = (timestamp: number) => new Date(timestamp).toISOString()
export const formatChartValue = (value: number) => String(value)
