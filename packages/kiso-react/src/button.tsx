"use client";
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
    size: { xs: "btn-xs", sm: "btn-sm", md: "", lg: "btn-lg", xl: "btn-xl" },
    presentation: { default: "", tile: "choice-tile" },
  },
  defaultVariants: { variant: "default", size: "md" },
})

function Button({
  className,
  variant = "default",
  size = "md",
  asChild = false,
  presentation = "default",
  icon,
  description,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    icon?: React.ReactNode
    description?: React.ReactNode
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const id = React.useId()
  const tile = presentation === "tile" && !asChild

  return (
    <Comp
      {...(!asChild ? { type: "button" as const } : {})}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-presentation={presentation}
      aria-labelledby={tile && !props["aria-label"] ? `${id}-label` : undefined}
      className={cn(buttonVariants({ variant, size, presentation, className }))}
      {...props}
      aria-describedby={[props["aria-describedby"], tile && description != null ? `${id}-description` : undefined].filter(Boolean).join(" ") || undefined}
    >
      {tile ? <>
        {icon != null && <span className="choice-icon" aria-hidden="true">{icon}</span>}
        <span className="choice-copy">
          <span className="choice-label" id={`${id}-label`}>{children}</span>
          {description != null && <span className="choice-description" id={`${id}-description`}>{description}</span>}
        </span>
      </> : children}
    </Comp>
  )
}

export { Button, buttonVariants }
