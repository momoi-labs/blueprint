"use client"

import * as React from "react"

import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect.js"

/* True inside an expanded DashboardPanel. A Chart there takes the height its
   box leaves after the legend and the closed exact-values summary, and no
   longer synchronizes with the Charts left on the grid. Not exported. */
export const ChartFillContext = React.createContext(false)

// The last plot height per chart and window size, so reopening the same panel
// mounts its Chart once at the right height instead of measuring again.
const fillHeights = new Map<string, number>()

export function useChartFill(frame: React.RefObject<HTMLElement | null>, key: string, fallback: number) {
  const fill = React.useContext(ChartFillContext)
  const cacheKey = typeof window === "undefined" ? key : `${key}|${window.innerWidth}x${window.innerHeight}`
  const [height, setHeight] = React.useState(() => fill ? fillHeights.get(cacheKey) : undefined)
  useIsomorphicLayoutEffect(() => {
    const figure = frame.current
    const box = figure?.parentElement
    if (!fill || !figure || !box || typeof ResizeObserver === "undefined") return
    const measure = () => {
      const style = getComputedStyle(box)
      const room = box.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
      // Opened exact values scroll the box instead of squeezing the plot.
      const details = figure.querySelector<HTMLDetailsElement>("details.chart-values")
      const opened = details?.open ? details.offsetHeight - (details.querySelector("summary")?.offsetHeight ?? 0) : 0
      // scrollHeight never drops below the box, so measure the content itself.
      const first = box.firstElementChild, last = box.lastElementChild
      const used = first && last ? last.getBoundingClientRect().bottom - first.getBoundingClientRect().top - opened : room
      const plots = figure.querySelectorAll<HTMLElement>(".chart-plot, .chart-empty")
      const charts = Math.max(1, box.querySelectorAll(":scope > [data-slot='chart']").length)
      const current = plots[0]?.offsetHeight ?? fallback
      const next = Math.max(fallback, Math.floor(current + (room - used) / charts / Math.max(1, plots.length)))
      fillHeights.set(cacheKey, next)
      setHeight(next)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    measure()
    return () => observer.disconnect()
  }, [fill, frame, cacheKey, fallback])
  return { fill, height: fill ? height : undefined }
}
