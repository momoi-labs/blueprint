// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
import * as React from "react";
import { clsx as cn } from "clsx";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn("textarea", className)}
      {...props}
    />
  );
}

export { Textarea };
