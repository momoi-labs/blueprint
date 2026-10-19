"use client"

import * as React from "react"
import { Line } from "recharts"

/* A chart treatment has two independent axes. The line sets the stroke shape,
   sample markers and gauge ends. The fill sets the area under a line and the
   empty part of a gauge track. A chart style is a preset of both. */
export type ChartLine = "straight" | "stepped" | "curved"
export type ChartFill = "none" | "dots" | "tint" | "squares" | "scanlines"
export type ChartStyle = "solid" | "pixel" | "halftone" | "rounded"
export type ChartTreatment = { line: ChartLine; fill: ChartFill }
export const chartStylePresets: Record<ChartStyle, ChartTreatment> = {
  solid: { line: "straight", fill: "none" },
  pixel: { line: "stepped", fill: "none" },
  halftone: { line: "straight", fill: "dots" },
  rounded: { line: "curved", fill: "none" },
}
const chartLines: readonly string[] = ["straight", "stepped", "curved"]
const chartFills: readonly string[] = ["none", "dots", "tint", "squares", "scanlines"]
export type ChartTreatmentProps = {
  /* Preset for both axes. Overrides the inherited treatment. */
  chartStyle?: ChartStyle
  /* Overrides the line axis alone. */
  chartLine?: ChartLine
  /* Overrides the fill axis alone. */
  chartFill?: ChartFill
}

// Geometry must update with a scoped appearance attribute, not just CSS paint.
export function useChartStyle(ref: React.RefObject<HTMLElement | null>, override: ChartTreatmentProps = {}, mounted = true): ChartTreatment {
  const [inherited, setInherited] = React.useState<ChartTreatment>(chartStylePresets.solid)
  const fixed = override.chartStyle || (override.chartLine && override.chartFill)
  React.useLayoutEffect(() => {
    if (fixed) return
    const element = ref.current
    if (!element) return
    const read = () => {
      const style = getComputedStyle(element)
      const line = style.getPropertyValue("--chart-line").trim()
      const fill = style.getPropertyValue("--chart-fill").trim()
      setInherited(current => {
        const next = { line: chartLines.includes(line) ? line as ChartLine : "straight", fill: chartFills.includes(fill) ? fill as ChartFill : "none" }
        return next.line === current.line && next.fill === current.fill ? current : next
      })
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(element.ownerDocument.documentElement, { attributes: true, subtree: true, attributeFilter: ["data-chart-style", "data-chart-line", "data-chart-fill"] })
    return () => observer.disconnect()
  }, [ref, fixed, mounted])
  const base = override.chartStyle ? chartStylePresets[override.chartStyle] : inherited
  return { line: override.chartLine ?? base.line, fill: override.chartFill ?? base.fill }
}

/* Layout and legend placement follow data-chart-layout and data-chart-legend
   on a containing element. A prop overrides them for one chart. */
export type ChartLayout = "standard" | "compact" | "split"
export type ChartLegendPlacement = "table" | "inline" | "sidebar"
const chartLayouts: readonly string[] = ["standard", "compact", "split"]
const chartLegends: readonly string[] = ["table", "inline", "sidebar"]
export function useChartPresentation(ref: React.RefObject<HTMLElement | null>, layout?: ChartLayout, legend?: ChartLegendPlacement) {
  const [inherited, setInherited] = React.useState<{ layout: ChartLayout; legend: ChartLegendPlacement }>({ layout: "standard", legend: "table" })
  const fixed = !!layout && !!legend
  React.useLayoutEffect(() => {
    if (fixed) return
    const element = ref.current
    if (!element) return
    const read = () => {
      const style = getComputedStyle(element)
      const nextLayout = style.getPropertyValue("--chart-layout").trim()
      const nextLegend = style.getPropertyValue("--chart-legend").trim()
      setInherited(current => {
        const next = { layout: chartLayouts.includes(nextLayout) ? nextLayout as ChartLayout : "standard", legend: chartLegends.includes(nextLegend) ? nextLegend as ChartLegendPlacement : "table" }
        return next.layout === current.layout && next.legend === current.legend ? current : next
      })
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(element.ownerDocument.documentElement, { attributes: true, subtree: true, attributeFilter: ["data-chart-layout", "data-chart-legend"] })
    return () => observer.disconnect()
  }, [ref, fixed])
  return { layout: layout ?? inherited.layout, legend: legend ?? inherited.legend }
}

// Rasterize each segment into small stairs while retaining its endpoints.
// Area paths traverse the baseline in reverse using the same curve factory.
type CurveFactory = Exclude<NonNullable<React.ComponentProps<typeof Line>["type"]>, string>
export const pixelCurve: CurveFactory = context => {
  let areaLine = NaN, count = 0, previousX = 0, previousY = 0
  return {
    areaStart() { areaLine = 0 },
    areaEnd() { areaLine = NaN },
    lineStart() { count = 0 },
    lineEnd() {
      if (areaLine || (areaLine !== 0 && count === 1)) context.closePath()
      areaLine = 1 - areaLine
    },
    point(x, y) {
      if (count === 0) {
        count = 1
        if (areaLine) context.lineTo(x, y)
        else context.moveTo(x, y)
      } else {
        count = 2
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x - previousX), Math.abs(y - previousY)) / 4))
        for (let step = 1; step <= steps; step++) {
          const nextX = previousX + (x - previousX) * step / steps
          const nextY = previousY + (y - previousY) * step / steps
          context.lineTo(nextX, previousY + (y - previousY) * (step - 1) / steps)
          context.lineTo(nextX, nextY)
        }
      }
      previousX = x
      previousY = y
    },
  }
}

/* The texture under a line. Dots and squares sit on a 4px screen; scanlines
   are 1px rules every 3px. None and tint need no pattern. */
export function ChartPattern({ id, color, fill }: { id: string; color: string; fill: ChartFill }) {
  if (fill === "scanlines") return <pattern id={id} width={4} height={3} patternUnits="userSpaceOnUse">
    <rect width={4} height={1} fill={color} />
  </pattern>
  return <pattern id={id} width={4} height={4} patternUnits="userSpaceOnUse">
    {fill === "squares" ? <rect width={2} height={2} fill={color} /> : <circle cx={1} cy={1} r={0.8} fill={color} />}
  </pattern>
}

export function ChartDot({ cx, cy, r = 4, fill, opacity, line }: {
  cx?: number; cy?: number; r?: number; fill?: string; opacity?: number; line: ChartLine
}) {
  if (cx === undefined || cy === undefined) return null
  return line === "stepped"
    ? <rect x={cx - r} y={cy - r} width={2 * r} height={2 * r} fill={fill} opacity={opacity} />
    : <circle cx={cx} cy={cy} r={r} fill={fill} opacity={opacity} />
}
