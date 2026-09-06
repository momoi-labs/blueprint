// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { clsx as cn } from "clsx"

function Stat({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat"
      className={cn("stat", className)}
      {...props}
    />
  )
}

/* The tile puts its label and its delta on one line. */
function StatHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-header"
      className={cn("between", className)}
      {...props}
    />
  )
}

function StatLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="stat-label"
      className={cn("stat-label", className)}
      {...props}
    />
  )
}

function StatValue({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="stat-value"
      className={cn("stat-value", className)}
      {...props}
    />
  )
}

function StatFoot({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="stat-foot"
      className={cn("stat-foot", className)}
      {...props}
    />
  )
}

const statDeltaVariants = cva("badge badge-outline stat-delta", {
  variants: { variant: {
    neutral: "", info: "info", success: "success",
    warning: "warning", danger: "danger",
  } },
  defaultVariants: { variant: "neutral" },
})

/* A slot rather than a prop: the direction arrow, the number and its unit are
   content, and only their colour is the component's business. */
function StatDelta({
  className,
  variant = "neutral",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof statDeltaVariants>) {
  return (
    <span
      data-slot="stat-delta"
      data-variant={variant}
      className={cn(statDeltaVariants({ variant }), className)}
      {...props}
    />
  )
}

export {
  Stat,
  StatHeader,
  StatLabel,
  StatValue,
  StatFoot,
  StatDelta,
  statDeltaVariants,
}
