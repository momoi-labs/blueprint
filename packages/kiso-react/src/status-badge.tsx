import * as React from "react"

import { Badge } from "./badge.js"
import { Dot } from "./dot.js"
import type { StatusBadgeSpec, StatusTone } from "./generated/status-badge.js"

export type { StatusTone }

/* Props come from the spec in crates/kiso-core; the label is `children`. */
export type StatusBadgeProps = Omit<React.ComponentProps<typeof Badge>, "variant" | "asChild"> &
  Omit<StatusBadgeSpec, "label">

/* The dot pulses while work is going, a run or a build; a thing that is
   merely up holds still. */
export function StatusBadge({ tone, pulse = false, children, ...props }: StatusBadgeProps) {
  return <Badge {...props} variant={tone}>
    <Dot pulse={pulse} />
    {children}
  </Badge>
}
