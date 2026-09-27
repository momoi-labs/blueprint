import * as React from "react"
import { clsx as cn } from "clsx"

export type LifecycleProps = Omit<React.ComponentProps<"div">, "children"> & {
  status: React.ReactNode
  actions?: React.ReactNode
  destructive?: React.ReactNode
}

/* The header row of a detail screen: what the thing is, what you can do to
   it, and the one action you do not want to hit by accident. Status is read,
   the verbs are pressed, and the destructive action sits outside both with a
   wider gap. A screen with no verbs passes none, and the middle group is
   dropped rather than rendered as an empty bordered box. */
export function Lifecycle({ status, actions, destructive, className, ...props }: LifecycleProps) {
  return <div {...props} data-slot="lifecycle" className={cn("lifecycle", className)}>
    <div className="cluster cluster-status" role="group" aria-label="Status">{status}</div>
    {actions ? <div className="cluster cluster-verbs" role="group" aria-label="Actions">{actions}</div> : null}
    {destructive}
  </div>
}
