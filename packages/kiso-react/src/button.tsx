// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { clsx as cn } from "clsx"
import { Slot } from "radix-ui"

const buttonVariants = cva("btn", {
  variants: {
    variant: {
      default: "btn-outline",
      primary: "btn-primary",
      destructive: "btn-danger",
      ghost: "btn-ghost",
    },
    size: { xs: "btn-xs", sm: "btn-sm", md: "", lg: "btn-lg" },
  },
  defaultVariants: { variant: "default", size: "md" },
})

function Button({
  className,
  variant = "default",
  size = "md",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      {...(!asChild ? { type: "button" as const } : {})}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
