"use client"

import * as React from "react"
import { Line } from "recharts"

export type ChartStyle = "solid" | "pixel" | "halftone" | "rounded"
const chartStyles: readonly string[] = ["solid", "pixel", "halftone", "rounded"]

// Geometry must update with a scoped appearance attribute, not just CSS paint.
export function useChartStyle(ref: React.RefObject<HTMLElement | null>, override?: ChartStyle, mounted = true): ChartStyle {
  const [inherited, setInherited] = React.useState<ChartStyle>("solid")
  React.useLayoutEffect(() => {
    if (override) return
    const element = ref.current
    if (!element) return
    const read = () => {
      const style = getComputedStyle(element).getPropertyValue("--chart-style").trim()
      setInherited(chartStyles.includes(style) ? style as ChartStyle : "solid")
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(element.ownerDocument.documentElement, { attributes: true, subtree: true, attributeFilter: ["data-chart-style"] })
    return () => observer.disconnect()
  }, [ref, override, mounted])
  return override ?? inherited
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

export function ChartPattern({ id, color }: { id: string; color: string }) {
  return <pattern id={id} width={4} height={4} patternUnits="userSpaceOnUse">
    <circle cx={1} cy={1} r={0.8} fill={color} />
  </pattern>
}

export function ChartDot({ cx, cy, r = 4, fill, opacity, chartStyle }: {
  cx?: number; cy?: number; r?: number; fill?: string; opacity?: number; chartStyle: ChartStyle
}) {
  if (cx === undefined || cy === undefined) return null
  return chartStyle === "pixel"
    ? <rect x={cx - r} y={cy - r} width={2 * r} height={2 * r} fill={fill} opacity={opacity} />
    : <circle cx={cx} cy={cy} r={r} fill={fill} opacity={opacity} />
}
