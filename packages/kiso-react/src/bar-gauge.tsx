import * as React from "react"
import { clsx as cn } from "clsx"
import { Meter } from "./meter.js"

export type BarGaugeProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: string
  rows: readonly { key: string; label: string; value: number | null }[]
  max: number
  formatValue?: (value: number) => string
}

export function BarGauge({ label, rows, max, formatValue = String, className, ...props }: BarGaugeProps) {
  if (!Number.isFinite(max) || max <= 0) throw new RangeError("Bar gauge max must be positive.")
  return <div {...props} role="group" aria-label={label} data-slot="bar-gauge" className={cn("bar-gauge", className)}>
    {rows.length ? rows.map(row => <Meter key={row.key} label={row.label} value={row.value} max={max}
      valueText={row.value !== null && Number.isFinite(row.value) ? formatValue(row.value) : "Not collected"} />)
      : <p>No measurements.</p>}
  </div>
}
