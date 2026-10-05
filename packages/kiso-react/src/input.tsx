// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
import * as React from "react"
import { clsx as cn } from "clsx"

type InputProps = React.ComponentProps<"input"> & { controlSize?: "sm" | "md" | "lg" | "xl" }

function Input({ className, type, controlSize, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-control-size={controlSize}
      className={cn("input", className)}
      {...props}
    />
  )
}

export { Input }
export type { InputProps }
