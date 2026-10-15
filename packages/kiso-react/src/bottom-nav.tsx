import * as React from "react";
import { clsx as cn } from "clsx";
import { Slot } from "radix-ui";

// A phone's main navigation, fixed to the bottom edge below 700px and not
// rendered above it. The product keeps the same destinations in its header or
// sidebar for wider screens, decides which one is current, and passes
// `asChild` to keep a router's own link component.
function BottomNav({ className, children, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav data-slot="bottom-nav" className={cn("bottom-nav", className)} {...props}>
      <ul className="bottom-nav-list">{children}</ul>
    </nav>
  );
}

function BottomNavLink({
  className,
  active = false,
  asChild = false,
  ...props
}: React.ComponentProps<"a"> & { active?: boolean; asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "a";

  return (
    <li data-slot="bottom-nav-item">
      <Comp
        data-slot="bottom-nav-link"
        aria-current={active ? "page" : undefined}
        className={cn("bottom-nav-link", className)}
        {...props}
      />
    </li>
  );
}

function BottomNavBadge({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="bottom-nav-badge" className={cn("bottom-nav-badge", className)} {...props} />;
}

export { BottomNav, BottomNavLink, BottomNavBadge };
