import * as React from "react";
import { clsx as cn } from "clsx";
import { Search as SearchIcon } from "lucide-react";
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
      <SearchIcon className="icon" aria-hidden="true" />
      <Input type="search" className={className} {...props} />
    </div>
  );
}

export { Search };
