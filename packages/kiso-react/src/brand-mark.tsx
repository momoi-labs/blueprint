import * as React from "react"
import { clsx as cn } from "clsx"
import { Slot } from "radix-ui"

function BrandMark({ className, children, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="brand-mark"
      className={cn("brand-mark", className)}
      {...props}
      aria-hidden="true"
    >
      {React.isValidElement(children) ? (
        <Slot.Root className="icon icon-sm">{children}</Slot.Root>
      ) : children}
    </span>
  )
}

export { BrandMark }
