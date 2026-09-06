// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
"use client";

import * as React from "react";
import { clsx as cn } from "clsx";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn("kiso-checkbox", className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="checkbox-indicator"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path
            className="checkbox-check"
            d="m3 8 3 3 7-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path className="checkbox-mixed" d="M3 8h10" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
