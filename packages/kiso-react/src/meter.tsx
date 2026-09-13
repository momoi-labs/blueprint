import * as React from "react"
import { clsx as cn } from "clsx"

export type MeterProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: string
  value: number | null
  min?: number
  max?: number
  valueText?: string
}

export function Meter({ label, value, min = 0, max = 100, valueText, className, ...props }: MeterProps) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) throw new RangeError("Meter max must exceed min.")
  const known = value !== null && Number.isFinite(value)
  const bounded = known ? Math.min(max, Math.max(min, value)) : undefined
  const text = valueText ?? (known ? `${value} / ${max}` : "Not collected")
  return <div {...props} data-slot="meter" className={cn("meter", className)}>
    <div className="meter-label"><span>{label}</span><span>{text}</span></div>
    <div role={known ? "meter" : undefined} aria-label={label}
      aria-valuemin={known ? min : undefined} aria-valuemax={known ? max : undefined}
      aria-valuenow={bounded} aria-valuetext={known ? text : undefined}
      className={cn("meter-track", !known && "hatch")}>
      {bounded !== undefined && <span style={{ width: `${(bounded - min) / (max - min) * 100}%` }} />}
    </div>
  </div>
}

export type ProgressProps = Omit<MeterProps, "min" | "value"> & { value?: number | null }
export function Progress({ label, value, max = 100, valueText, className, ...props }: ProgressProps) {
  if (!Number.isFinite(max) || max <= 0) throw new RangeError("Progress max must be positive.")
  const known = value != null && Number.isFinite(value)
  const text = valueText ?? (known ? `${value} / ${max}` : "In progress")
  return <div {...props} data-slot="progress" className={cn("meter", className)}>
    <div className="meter-label"><span>{label}</span><span>{text}</span></div>
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max}
      aria-valuenow={known ? Math.min(max, Math.max(0, value)) : undefined} aria-valuetext={text}
      className={cn("meter-track", !known && "hatch")}>
      {known && <span style={{ width: `${Math.min(1, Math.max(0, value / max)) * 100}%` }} />}
    </div>
  </div>
}
