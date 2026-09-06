// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { clsx as cn } from "clsx"
import { Slot } from "radix-ui"

const badgeVariants = cva("badge", {
  variants: { variant: {
    neutral: "", info: "badge-info", success: "badge-success",
    warning: "badge-warning", danger: "badge-danger",
  } },
  defaultVariants: { variant: "neutral" },
})

function Badge({
  className,
  variant = "neutral",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
