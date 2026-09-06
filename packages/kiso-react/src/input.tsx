// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
import * as React from "react"
import { clsx as cn } from "clsx"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn("input", className)}
      {...props}
    />
  )
}

export { Input }
