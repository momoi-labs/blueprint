import * as React from "react";
import { clsx as cn } from "clsx";

/* Pages or cards fanned in depth. The last child is in front; the one under
   the pointer or focus comes forward. */
function PerspectiveStack({ className, children, width, style, ...props }:
  React.ComponentProps<"div"> & { width?: string }) {
  const items = React.Children.toArray(children);
  return (
    <div data-slot="perspective-stack" className={cn("perspective-stack", className)}
      style={{ "--n": items.length, ...(width ? { "--perspective-stack-width": width } : {}), ...style } as React.CSSProperties} {...props}>
      {items.map((item, index) => (
        <div className="perspective-stack-item" key={index} style={{ "--i": index } as React.CSSProperties}>{item}</div>
      ))}
    </div>
  );
}

export { PerspectiveStack };
