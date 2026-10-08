"use client"

// Sparkline: one metric series at cell size, no axis, grid, or tooltip.
// Contract: kiso/docs/components/sparkline.md. Recharts generates the path;
// the `.sparkline` frame in ui.css picks the color tokens.
import * as React from "react"
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts"
import { clsx as cn } from "clsx"
import { ChartPattern, pixelCurve, useChartStyle, type ChartStyle } from "./chart-style.js"

export type SparklineProps = Omit<React.ComponentProps<"div">, "ref"> & {
  values: readonly (number | null)[]
  height?: number
  tone?: "neutral" | "primary"
  fill?: boolean
  min?: number
  max?: number
  label?: string
  ref?: React.Ref<HTMLDivElement>
  chartStyle?: ChartStyle
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
  chartStyle,
  ...props
}: SparklineProps) {
  const id = React.useId()
  const frame = React.useRef<HTMLDivElement>(null)
  // Below two samples there is no shape to show, and a flat rule across a
  // cell reads as a border rather than as a measurement.
  const known = values.filter((value): value is number => value !== null && Number.isFinite(value))
  const treatment = useChartStyle(frame, chartStyle, known.length >= 2)
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
      ref={element => {
        frame.current = element
        if (typeof ref === "function") return ref(element)
        if (ref) ref.current = element
      }}
      data-slot="sparkline"
      data-chart-treatment={treatment}
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
          <defs><ChartPattern id={`${id}-halftone`} color="currentColor" /></defs>
          <YAxis hide domain={[lo, hi]} />
          <Area
            type={treatment === "pixel" ? pixelCurve : treatment === "rounded" ? "monotone" : "linear"}
            connectNulls={false}
            dataKey="value"
            stroke="currentColor"
            strokeWidth={treatment === "pixel" || treatment === "rounded" ? 2 : 1.5}
            strokeLinecap={treatment === "rounded" ? "round" : "butt"}
            strokeLinejoin={treatment === "rounded" ? "round" : "miter"}
            fill={treatment === "halftone" ? `url(#${id}-halftone)` : fill ? "currentColor" : "none"}
            fillOpacity={treatment === "halftone" ? 0.3 : fill ? 0.12 : 0}
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
