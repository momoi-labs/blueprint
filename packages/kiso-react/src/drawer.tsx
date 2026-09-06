"use client";

import * as React from "react";
import { clsx as cn } from "clsx";
import { Dialog as DialogPrimitive } from "radix-ui";

import {
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogDescription,
} from "./dialog.js";

// A Drawer is a Dialog anchored to an edge: same task semantics, same
// accessible name, different placement.
function Drawer({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerContent({
  className,
  placement = "bottom",
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  placement?: "bottom" | "side";
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        aria-modal="true"
        data-slot="drawer-content"
        data-placement={placement}
        className={cn("kiso-react-drawer marked", className)}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DialogClose as DrawerClose,
  DialogHeader as DrawerHeader,
  DialogBody as DrawerBody,
  DialogFooter as DrawerFooter,
  DialogTitle as DrawerTitle,
  DialogDescription as DrawerDescription,
};
