import * as React from "react"
import { clsx as cn } from "clsx"

function TerminalIcon({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      data-slot="terminal-icon"
      className={cn("icon", className)}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M4 4.5L8 8l-4 3.5" />
      <path d="M9.5 11.5H13" />
    </svg>
  )
}

export { TerminalIcon }
