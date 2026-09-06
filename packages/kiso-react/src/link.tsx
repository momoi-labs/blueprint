import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx as cn } from "clsx";
import { Slot } from "radix-ui";

const linkVariants = cva("", {
  variants: { variant: { inline: "link", standalone: "nav-item" } },
  defaultVariants: { variant: "inline" },
});

// A destination that must carry Button weight is <Button asChild><a /></Button>,
// not a third variant here.
function Link({
  className,
  variant = "inline",
  active = false,
  asChild = false,
  ...props
}: React.ComponentProps<"a"> &
  VariantProps<typeof linkVariants> & {
    active?: boolean;
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "a";

  return (
    <Comp
      data-slot="link"
      data-variant={variant}
      aria-current={active ? "page" : undefined}
      className={cn(linkVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Link, linkVariants };
