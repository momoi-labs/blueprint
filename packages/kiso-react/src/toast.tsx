// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx as cn } from "clsx";
import { Toast as ToastPrimitive } from "radix-ui";

const toastVariants = cva("toast", {
  variants: {
    variant: {
      neutral: "",
      success: "toast-success",
      warning: "toast-warning",
      error: "toast-error",
    },
  },
  defaultVariants: { variant: "neutral" },
});

function ToastProvider({
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Provider>) {
  return <ToastPrimitive.Provider {...props} />;
}

function ToastViewport({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn("toast-region", className)}
      {...props}
    />
  );
}

// An error interrupts (assertive); everything else waits its turn (polite).
function Toast({
  className,
  variant = "neutral",
  type,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Root> &
  VariantProps<typeof toastVariants>) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      data-variant={variant}
      type={type ?? (variant === "error" ? "foreground" : "background")}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
}

function ToastTitle({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Title>) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("alert-title", className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Description>) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("alert-body", className)}
      {...props}
    />
  );
}

function ToastContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toast-content"
      className={cn("stack-xs grow", className)}
      {...props}
    />
  );
}

function ToastAction({
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Action>) {
  return <ToastPrimitive.Action data-slot="toast-action" {...props} />;
}

function ToastClose({
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Close>) {
  return <ToastPrimitive.Close data-slot="toast-close" {...props} />;
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastContent,
  ToastAction,
  ToastClose,
  toastVariants,
};
