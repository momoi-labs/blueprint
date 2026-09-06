import * as React from "react";
import { clsx as cn } from "clsx";
import { Slot } from "radix-ui";

// Navigation carries landmark and grouping semantics only. Which destination is
// current is the product's answer: pass `active`, and pass `asChild` to keep a
// router's own link component.
function Navigation({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav data-slot="navigation" className={cn("", className)} {...props} />;
}

function NavigationGroup({
  className,
  label,
  children,
  ...props
}: React.ComponentProps<"div"> & { label?: string }) {
  return (
    <div
      data-slot="navigation-group"
      className={cn("nav-group", className)}
      {...props}
    >
      {label && <p className="t-caps">{label}</p>}
      {children}
    </div>
  );
}

function NavigationList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul data-slot="navigation-list" className={cn("", className)} {...props} />
  );
}

function NavigationItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li data-slot="navigation-item" className={cn("", className)} {...props} />
  );
}

function NavigationLink({
  className,
  active = false,
  asChild = false,
  ...props
}: React.ComponentProps<"a"> & { active?: boolean; asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "a";

  return (
    <Comp
      data-slot="navigation-link"
      aria-current={active ? "page" : undefined}
      className={cn("nav-item", className)}
      {...props}
    />
  );
}

export {
  Navigation,
  NavigationGroup,
  NavigationList,
  NavigationItem,
  NavigationLink,
};
