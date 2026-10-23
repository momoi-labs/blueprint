import * as React from "react"
import { clsx as cn } from "clsx"
import { Meter } from "./meter.js"

const defaultLabels = { notCollected: "Not collected", empty: "No measurements." }

export type BarGaugeProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: string
  rows: readonly { key: string; label: string; value: number | null }[]
  max: number
  formatValue?: (value: number) => string
  labels?: Partial<typeof defaultLabels>
}

export function BarGauge({ label, rows, max, formatValue = String, labels, className, ...props }: BarGaugeProps) {
  if (!Number.isFinite(max) || max <= 0) throw new RangeError("Bar gauge max must be positive.")
  const text = { ...defaultLabels, ...labels }
  return <div {...props} role="group" aria-label={label} data-slot="bar-gauge" className={cn("bar-gauge", className)}>
    {rows.length ? rows.map(row => <Meter key={row.key} label={row.label} value={row.value} max={max}
      valueText={row.value !== null && Number.isFinite(row.value) ? formatValue(row.value) : text.notCollected} />)
      : <p>{text.empty}</p>}
  </div>
}
