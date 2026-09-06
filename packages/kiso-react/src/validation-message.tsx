import * as React from "react";
import { clsx as cn } from "clsx";

// Associate it with the control through aria-describedby, and mark the control
// aria-invalid. Give it an id the control can point at.
function ValidationMessage({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="validation-message"
      className={cn("field-error", className)}
      {...props}
    />
  );
}

export { ValidationMessage };
