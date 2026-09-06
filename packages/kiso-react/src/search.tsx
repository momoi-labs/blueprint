import * as React from "react";
import { clsx as cn } from "clsx";
import { Input } from "./input.js";

// Filters a collection that is already on screen. Global commands are
// CommandPalette; a single field is Input.
function Search({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<"input"> & { containerClassName?: string }) {
  return (
    <div
      data-slot="search"
      className={cn("input-group", containerClassName)}
    >
      <svg
        className="icon"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="4.5" />
        <path d="m10.5 10.5 3 3" />
      </svg>
      <Input type="search" className={className} {...props} />
    </div>
  );
}

export { Search };
