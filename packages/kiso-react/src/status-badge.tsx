import * as React from "react"
import { clsx as cn } from "clsx"
import type { LucideIcon } from "lucide-react"

import { Badge } from "./badge.js"
import { seriesColor, type DiagramSeries } from "./chart-data.js"
import { Dot } from "./dot.js"
import type { StatusBadgeSpec, StatusTone } from "./generated/status-badge.js"

export type { StatusTone }

/* Props come from the spec in crates/kiso-core; the label is `children`.
   `series` is React only: it ties the state to a Diagram edge, and the
   terminal draws no Diagram. */
export type StatusBadgeProps = Omit<React.ComponentProps<typeof Badge>, "variant" | "asChild"> &
  Omit<StatusBadgeSpec, "label" | "tone"> & (
    | { tone: StatusTone; series?: never; icon?: never }
    /** A state that belongs to a Diagram edge, such as "Streaming" on the
        node a replication edge feeds: the edge's series colour in place of
        a tone. `icon` replaces the dot and takes its pulse. */
    | { series: DiagramSeries; icon?: LucideIcon; tone?: never }
  )

/* The dot pulses while work is going, a run or a build; a thing that is
   merely up holds still. */
export function StatusBadge({ tone, series, icon: Icon, pulse = false, className, style, children, ...props }: StatusBadgeProps) {
  if (series == null) {
    return <Badge {...props} className={className} style={style} variant={tone}>
      <Dot pulse={pulse} />
      {children}
    </Badge>
  }
  return <Badge {...props} data-variant="series" data-series={series} className={cn("badge-series", className)}
    style={{ "--badge-series": seriesColor(series), ...style } as React.CSSProperties}>
    {Icon
      ? <span className={cn("badge-series-icon", pulse && "dot-pulse")} aria-hidden="true">
          <Icon className="icon" strokeWidth={1.75} aria-hidden="true" focusable="false" />
        </span>
      : <Dot pulse={pulse} />}
    {children}
  </Badge>
}
