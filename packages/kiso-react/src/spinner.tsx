import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx as cn } from "clsx";

const spinnerVariants = cva("spinner", {
  variants: { size: { sm: "spinner-sm", md: "", lg: "spinner-lg" } },
  defaultVariants: { size: "md" },
});

// Without a label the Spinner is decorative: its wait is announced by the
// Button, region, or status text around it.
function Spinner({
  className,
  size = "md",
  label,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof spinnerVariants> & { label?: string }) {
  return (
    <span
      data-slot="spinner"
      data-size={size}
      className={cn(spinnerVariants({ size }), className)}
      {...(label
        ? { role: "status", "aria-label": label }
        : { "aria-hidden": true })}
      {...props}
    />
  );
}

export { Spinner, spinnerVariants };
