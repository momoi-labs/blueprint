import * as React from "react"

import { Badge } from "./badge.js"
import { Dot } from "./dot.js"

/* Green is alive, red is failed, neutral is what is not happening. No fourth
   colour: a status reads like a light on a device. */
export type StatusTone = "success" | "danger" | "neutral"

export type StatusBadgeProps = Omit<React.ComponentProps<typeof Badge>, "variant" | "asChild"> & {
  tone: StatusTone
  pulse?: boolean
}

/* The dot pulses while work is going, a run or a build; a thing that is
   merely up holds still. */
export function StatusBadge({ tone, pulse = false, children, ...props }: StatusBadgeProps) {
  return <Badge {...props} variant={tone}>
    <Dot pulse={pulse} />
    {children}
  </Badge>
}
