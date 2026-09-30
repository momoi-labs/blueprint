import * as React from "react";
import { clsx as cn } from "clsx";

// Sidebar is layout. Its destinations are Navigation children, so it holds no
// route, no active item, and no disclosure state of its own.
function Sidebar({
  className,
  collapsed = false,
  ...props
}: React.ComponentProps<"aside"> & { collapsed?: boolean }) {
  return (
    <aside
      data-slot="sidebar"
      data-collapsed={collapsed || undefined}
      className={cn("sidebar", className)}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("sidebar-header", className)}
      {...props}
    />
  );
}

function SidebarBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-body"
      className={cn("sidebar-body", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("sidebar-footer", className)}
      {...props}
    />
  );
}

export { Sidebar, SidebarHeader, SidebarBody, SidebarFooter };
