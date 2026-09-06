import * as React from "react";
import { clsx as cn } from "clsx";
import { Slot } from "radix-ui";

// Actions sit beside the title, so they are a prop rather than a child: the
// title block keeps its own grid either way.
function PageHeader({
  className,
  actions,
  children,
  ...props
}: React.ComponentProps<"div"> & { actions?: React.ReactNode }) {
  const heading = (
    <div
      data-slot="page-header"
      className={cn("page-header", className)}
      {...props}
    >
      {children}
    </div>
  );

  if (!actions) return heading;

  return (
    <div data-slot="page-header-row" className="between">
      {heading}
      <div data-slot="page-header-actions" className="row-wrap">
        {actions}
      </div>
    </div>
  );
}

function PageHeaderTitle({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"h1"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "h1";

  return (
    <Comp
      data-slot="page-header-title"
      className={cn("t-h1", className)}
      {...props}
    />
  );
}

function PageHeaderDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-header-description"
      className={cn("muted t-label", className)}
      {...props}
    />
  );
}

export { PageHeader, PageHeaderTitle, PageHeaderDescription };
