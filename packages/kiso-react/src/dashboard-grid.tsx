import * as React from "react"
import { clsx as cn } from "clsx"

export function DashboardGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div {...props} data-slot="dashboard-grid" className={cn("dashboard-grid", className)} />
}

export type DashboardPanelProps = React.ComponentProps<"div"> & { span?: 3 | 4 | 6 | 8 | 12 }
export function DashboardPanel({ span = 6, className, style, ...props }: DashboardPanelProps) {
  return <div {...props} data-slot="dashboard-panel" data-span={span} className={cn("dashboard-panel", className)}
    style={{ "--dashboard-span": span, ...style } as React.CSSProperties} />
}
