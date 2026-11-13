import * as React from "react";
import { clsx as cn } from "clsx";
import { PanelShadow } from "./panel-shadow.js";

// Shared product chrome: brand, Navigation, and global status or actions.
// Location within the product is Breadcrumb, not Header.
function Header({ className, variant, size, children, ...props }: React.ComponentProps<"header"> & { variant?: "default" | "plain" | "floating"; size?: "compact" | "default" | "editorial" }) {
  return (
    <header data-slot="header" data-variant={variant} data-size={size} className={cn("topbar", className)} {...props}><PanelShadow />{children}</header>
  );
}

export { Header };
