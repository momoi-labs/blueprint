import * as React from "react"
import { clsx as cn } from "clsx"

import { GridPane, PaneGrid, type GridPaneProps, type PaneGridProps } from "./pane-grid.js"

/* A dashboard is a PaneGrid: the product seeds each panel's size and row, and
   the reader moves and resizes panels. The product persists the layout. */

export type DashboardGridProps = PaneGridProps
export function DashboardGrid({ className, ...props }: DashboardGridProps) {
  return <PaneGrid data-slot="dashboard-grid" className={cn("dashboard-grid", className)} {...props} />
}

/* PaneGrid reads `id`, `size`, `min` and `newRow` from its children, so a
   panel takes the same props as a GridPane. */
export type DashboardPanelProps = GridPaneProps
export function DashboardPanel({ className, ...props }: DashboardPanelProps) {
  return <GridPane data-slot="dashboard-panel" className={cn("dashboard-panel", className)} {...props} />
}
