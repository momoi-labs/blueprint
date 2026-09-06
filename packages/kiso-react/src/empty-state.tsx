import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx as cn } from "clsx";
import { Slot } from "radix-ui";

// Emptiness is not an error: the variants change which action belongs here, not
// the colour of the surface.
const emptyStateVariants = cva("empty", {
  variants: {
    variant: { "first-run": "", "no-results": "", informational: "" },
    size: { md: "", sm: "empty-sm" },
  },
  defaultVariants: { variant: "first-run", size: "md" },
});

function EmptyState({
  className,
  variant = "first-run",
  size = "md",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyStateVariants>) {
  return (
    <div
      data-slot="empty-state"
      data-variant={variant}
      data-size={size}
      className={cn(emptyStateVariants({ variant, size }), className)}
      {...props}
    />
  );
}

function EmptyStateIcon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-state-icon"
      aria-hidden="true"
      className={cn("empty-icon", className)}
      {...props}
    />
  );
}

function EmptyStateTitle({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"h3"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "h3";

  return (
    <Comp
      data-slot="empty-state-title"
      className={cn("t-h3", className)}
      {...props}
    />
  );
}

function EmptyStateDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-state-description"
      className={cn("", className)}
      {...props}
    />
  );
}

function EmptyStateActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-state-actions"
      className={cn("row-wrap", className)}
      {...props}
    />
  );
}

export {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  emptyStateVariants,
};
