import * as React from "react";
import { clsx as cn } from "clsx";

// Shared product chrome: brand, Navigation, and global status or actions.
// Location within the product is Breadcrumb, not Header.
function Header({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header data-slot="header" className={cn("topbar", className)} {...props} />
  );
}

export { Header };
