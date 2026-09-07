// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx as cn } from "clsx";
import { Toast as ToastPrimitive } from "radix-ui";
import { Button } from "./button.js";

type ToastVariant = "neutral" | "success" | "warning" | "error";
type ToastNotice = {
  id: number;
  variant: ToastVariant;
  title: React.ReactNode;
  body?: React.ReactNode;
};
type ToastNotify = (
  variant: ToastVariant,
  title: React.ReactNode,
  body?: React.ReactNode,
) => void;

const ToastContext = React.createContext<ToastNotify | null>(null);

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

function useToast(): ToastNotify {
  const notify = React.useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used within Toasts");
  return notify;
}

function Toasts({
  children,
  duration = 6000,
}: {
  children: React.ReactNode;
  duration?: number;
}) {
  const [notices, setNotices] = React.useState<ToastNotice[]>([]);
  const nextId = React.useRef(0);

  const notify = React.useCallback<ToastNotify>((variant, title, body) => {
    const id = nextId.current++;
    setNotices((current) => [...current, { id, variant, title, body }]);
  }, []);

  const dismiss = React.useCallback((id: number) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      <ToastProvider duration={duration}>
        {children}
        {notices.map((notice) => (
          <Toast
            key={notice.id}
            variant={notice.variant}
            onOpenChange={(open) => {
              if (!open) dismiss(notice.id);
            }}
          >
            <ToastContent>
              <ToastTitle>{notice.title}</ToastTitle>
              {typeof notice.body === "string" || typeof notice.body === "number"
                ? <ToastDescription>{notice.body}</ToastDescription>
                : notice.body}
            </ToastContent>
            <ToastClose asChild>
              <Button size="xs" variant="ghost">Dismiss</Button>
            </ToastClose>
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
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
  Toasts,
  useToast,
  toastVariants,
};
export type { ToastNotify, ToastVariant };
