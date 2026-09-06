import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx as cn } from "clsx";

const alertVariants = cva("alert", {
  variants: {
    variant: {
      info: "alert-info",
      success: "alert-success",
      warning: "alert-warning",
      error: "alert-danger",
    },
  },
  defaultVariants: { variant: "info" },
});

function Alert({
  className,
  variant = "info",
  role,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role={role ?? (variant === "error" ? "alert" : "status")}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-content"
      className={cn("stack-xs grow", className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="alert-title" className={cn("alert-title", className)} {...props} />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="alert-description" className={cn("alert-body", className)} {...props} />
  );
}

export { Alert, AlertContent, AlertTitle, AlertDescription, alertVariants };
