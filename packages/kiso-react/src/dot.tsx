// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { clsx as cn } from "clsx"

/* `.dot` paints itself with `currentColor`, so the utility classes that carry
   status colour double as the variant. Spelled as a `variant` prop because
   that is how Badge already says the same thing. */
const dotVariants = cva("dot", {
  variants: {
    variant: {
      neutral: "", info: "info", success: "success",
      warning: "warning", danger: "danger",
    },
    size: { md: "", lg: "dot-lg" },
    pulse: { true: "dot-pulse", false: "" },
  },
  defaultVariants: { variant: "neutral", size: "md", pulse: false },
})

function Dot({
  className,
  variant = "neutral",
  size = "md",
  pulse = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof dotVariants>) {
  return (
    <span
      data-slot="dot"
      data-variant={variant}
      className={cn(dotVariants({ variant, size, pulse }), className)}
      aria-hidden="true"
      {...props}
    />
  )
}

export { Dot, dotVariants }
