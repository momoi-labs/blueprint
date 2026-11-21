"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx as cn } from "clsx";
import { ChevronDown, X } from "lucide-react";
import { Portal as PortalPrimitive } from "radix-ui";
import { Button } from "./button.js";
import { LoudMark } from "./loud-mark.js";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect.js";

const alertVariants = cva("alert", {
  variants: {
    variant: {
      info: "alert-info",
      success: "alert-success",
      warning: "alert-warning",
      error: "alert-danger",
    },
    appearance: { tinted: "", rail: "alert-rail", loud: "alert-loud" },
  },
  defaultVariants: { variant: "info", appearance: "tinted" },
});

type AlertVariant = "info" | "success" | "warning" | "error";
type AlertTape = "top" | "start" | "top-bottom" | "start-end" | "none";

const overlayStore = {
  stack: [] as string[],
  listeners: new Set<() => void>(),
  set(stack: string[]) {
    overlayStore.stack = stack;
    overlayStore.listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    overlayStore.listeners.add(listener);
    return () => overlayStore.listeners.delete(listener);
  },
};
const noOverlays: string[] = [];

function useOverlaySlot(overlay: boolean, id: string) {
  const stack = React.useSyncExternalStore(
    overlayStore.subscribe,
    () => overlayStore.stack,
    () => noOverlays,
  );
  useIsomorphicLayoutEffect(() => {
    if (!overlay) return;
    overlayStore.set([...overlayStore.stack.filter((item) => item !== id), id]);
    return () => overlayStore.set(overlayStore.stack.filter((item) => item !== id));
  }, [overlay, id]);
  const index = stack.indexOf(id);
  const top = index === stack.length - 1;
  return { hidden: overlay && index !== -1 && !top, more: overlay && top ? stack.length - 1 : 0 };
}

const AlertDetailsContext = React.createContext<{ id: string; open: boolean } | null>(null);

function Alert({
  className,
  variant = "info",
  appearance = "tinted",
  tape,
  animated = false,
  pulse = false,
  placement = "inline",
  onDismiss,
  role,
  ref,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    tape?: AlertTape;
    animated?: boolean;
    pulse?: boolean;
    placement?: "inline" | "overlay";
    onDismiss?: () => void;
  }) {
  const severity: AlertVariant = variant ?? "info";
  const loud = appearance === "loud";
  const id = React.useId();
  const detailsId = `${id}-details`;
  const [open, setOpen] = React.useState(false);
  const root = React.useRef<HTMLDivElement | null>(null);
  const returnTo = React.useRef<Element | null>(null);
  const { hidden, more } = useOverlaySlot(placement === "overlay", id);
  const hasDetails = React.Children.toArray(children).some(
    (child) => React.isValidElement(child) && child.type === AlertDetails,
  );

  React.useEffect(() => {
    returnTo.current = document.activeElement;
  }, []);

  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    },
    [ref],
  );

  function dismiss() {
    const target = returnTo.current;
    onDismiss?.();
    requestAnimationFrame(() => {
      if (target instanceof HTMLElement && target.isConnected && target !== document.body && !root.current?.contains(target)) {
        target.focus();
        return;
      }
      const heading = document.querySelector<HTMLElement>("main h1, h1");
      if (!heading) return;
      if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
      heading.focus();
    });
  }

  const resolvedTape = tape ?? (severity === "error" || severity === "warning" ? "top" : "none");

  const alert = (
    <div
      ref={setRef}
      data-slot="alert"
      data-variant={variant}
      data-appearance={appearance}
      data-placement={placement}
      data-tape={loud ? resolvedTape : undefined}
      data-animated={loud && animated ? "true" : undefined}
      data-pulse={loud && pulse ? "true" : undefined}
      role={role ?? (severity === "error" ? "alert" : "status")}
      hidden={hidden || undefined}
      className={cn(
        alertVariants({ variant, appearance }),
        placement === "overlay" && "alert-overlay",
        className,
      )}
      {...props}
    >
      {loud && <LoudMark variant={severity} />}
      <AlertDetailsContext.Provider value={{ id: detailsId, open }}>{children}</AlertDetailsContext.Provider>
      {(hasDetails || onDismiss || more > 0) && (
        <div data-slot="alert-actions" className="alert-actions">
          {more > 0 && (
            <span className="alert-count" aria-label={`${more} more ${more === 1 ? "alert" : "alerts"}`}>+{more}</span>
          )}
          {hasDetails && (
            <Button
              size="xs"
              className="alert-details-toggle"
              aria-expanded={open}
              aria-controls={detailsId}
              onClick={() => setOpen((value) => !value)}
            >
              <ChevronDown className="icon icon-sm" aria-hidden="true" />
              {open ? "Hide details" : "Details"}
            </Button>
          )}
          {onDismiss && (
            <Button className="btn-icon" size="sm" variant="ghost" aria-label="Dismiss" onClick={dismiss}>
              <X className="icon icon-sm" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
  return placement === "overlay" ? <PortalPrimitive.Root asChild>{alert}</PortalPrimitive.Root> : alert;
}

function AlertContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-content"
      className={cn("alert-content stack-xs grow", className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="alert-title" className={cn("alert-title", className)} {...props} />
  );
}

function AlertLabel({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="alert-label" className={cn("alert-label", className)} {...props} />
  );
}

function AlertMessage({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="alert-message" className={cn("alert-message", className)} {...props} />
  );
}

function AlertMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="alert-meta" className={cn("alert-meta", className)} {...props} />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="alert-description" className={cn("alert-body", className)} {...props} />
  );
}

function AlertDetails({ className, ...props }: React.ComponentProps<"div">) {
  const details = React.useContext(AlertDetailsContext);
  return (
    <div
      data-slot="alert-details"
      id={details?.id}
      hidden={details ? !details.open : undefined}
      className={cn("alert-details", className)}
      {...props}
    />
  );
}

export { Alert, AlertContent, AlertLabel, AlertTitle, AlertMessage, AlertDescription, AlertMeta, AlertDetails, alertVariants };
export type { AlertTape, AlertVariant };
