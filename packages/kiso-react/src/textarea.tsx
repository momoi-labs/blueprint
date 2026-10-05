// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
import * as React from "react";
import { clsx as cn } from "clsx";

function Textarea({ className, controlSize, ...props }: React.ComponentProps<"textarea"> & { controlSize?: "sm" | "md" | "lg" | "xl" }) {
  return (
    <textarea
      data-slot="textarea"
      data-control-size={controlSize}
      className={cn("textarea", className)}
      {...props}
    />
  );
}

export { Textarea };
