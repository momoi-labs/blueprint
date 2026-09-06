// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
"use client";

import * as React from "react";
import { clsx as cn } from "clsx";
import { Switch as SwitchPrimitive } from "radix-ui";

// One immediate boolean setting. A form choice is Checkbox; one value out of
// many is Select.
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn("kiso-react-switch", className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="kiso-react-switch-thumb"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
