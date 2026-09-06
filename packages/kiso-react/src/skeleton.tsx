import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx as cn } from "clsx";

const skeletonVariants = cva("skeleton", {
  variants: {
    variant: { text: "skeleton-text", block: "", circle: "skeleton-circle" },
  },
  defaultVariants: { variant: "text" },
});

// The loading region owns aria-busy and the accessible label; each placeholder
// is decorative.
function Skeleton({
  className,
  variant = "text",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof skeletonVariants>) {
  return (
    <div
      data-slot="skeleton"
      data-variant={variant}
      aria-hidden="true"
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Skeleton, skeletonVariants };
