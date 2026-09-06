// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { Separator as SeparatorPrimitive } from "radix-ui"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        orientation === "vertical" ? "separator-v" : "separator",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
