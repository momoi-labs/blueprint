// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { Label as LabelPrimitive } from "radix-ui"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn("t-label", className)}
      {...props}
    />
  )
}

export { Label }
