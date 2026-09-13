"use client"

// Sparkline: one metric series at cell size, no axis, grid, or tooltip.
// Contract: kiso/docs/components/sparkline.md. Recharts generates the path;
// the `.sparkline` frame in ui.css picks the color tokens.
import * as React from "react"
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts"
import { clsx as cn } from "clsx"

export type SparklineProps = Omit<React.ComponentProps<"div">, "ref"> & {
  values: readonly (number | null)[]
  height?: number
  tone?: "neutral" | "primary"
  fill?: boolean
  min?: number
  max?: number
  label?: string
  ref?: React.Ref<HTMLDivElement>
}

function Sparkline({
  values,
  height = 24,
  tone = "neutral",
  fill = false,
  min,
  max,
  label,
  className,
  style,
  ref,
  ...props
}: SparklineProps) {
  // Below two samples there is no shape to show, and a flat rule across a
  // cell reads as a border rather than as a measurement.
  const known = values.filter((value): value is number => value !== null && Number.isFinite(value))
  if (known.length < 2) return null

  // Default domain is the data's own extent; pass min and max to make
  // sibling sparklines share one scale, so rows compare honestly.
  let lo = min ?? Math.min(...known)
  let hi = max ?? Math.max(...known)
  const pad = lo === hi ? Math.max(1, Math.abs(lo) * 0.1) : 0
  lo -= pad
  hi += pad

  return (
    <div
      ref={ref}
      data-slot="sparkline"
      data-tone={tone}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("sparkline", tone === "primary" && "primary", className)}
      style={{ height, ...style }}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={values.map((value) => ({ value: value !== null && Number.isFinite(value) ? value : null }))}
          margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
        >
          <YAxis hide domain={[lo, hi]} />
          <Area
            type="monotone"
            connectNulls={false}
            dataKey="value"
            stroke="currentColor"
            strokeWidth={1.5}
            fill={fill ? "currentColor" : "none"}
            fillOpacity={fill ? 0.12 : 0}
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export { Sparkline }
