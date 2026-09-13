import * as React from "react"
import { clsx as cn } from "clsx"

export type DisclosureProps = Omit<React.ComponentProps<"details">, "title"> & {
  summary: React.ReactNode
}

export function Disclosure({ summary, className, children, ...props }: DisclosureProps) {
  return <details {...props} data-slot="disclosure" className={cn("disclosure", className)}>
    <summary>{summary}</summary><div className="disclosure-content">{children}</div>
  </details>
}
