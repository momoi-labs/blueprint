"use client";

import * as React from "react";
import { clsx as cn } from "clsx";
import { Dialog as DialogPrimitive, VisuallyHidden } from "radix-ui";

import { DialogOverlay, DialogPortal } from "./dialog.js";

// The palette owns its overlay, focus, and in-palette keys. Matching is the
// product's: render the items that match the query. The shortcut that opens it
// is product chrome too, so the palette stays controlled.
const CommandPaletteContext = React.createContext<{
  activeId: string;
  setActiveId: (id: string) => void;
  listId: string;
  listRef: React.RefObject<HTMLDivElement | null>;
} | null>(null);

function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext);
  if (!context) {
    throw new Error("CommandPalette parts must be used inside <CommandPalette>");
  }
  return context;
}

function items(list: HTMLElement | null) {
  return Array.from(
    list?.querySelectorAll<HTMLElement>(
      '[data-slot="command-palette-item"]:not([aria-disabled="true"])',
    ) ?? [],
  );
}

function CommandPalette({
  className,
  label = "Command palette",
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root> & {
  className?: string;
  label?: string;
}) {
  const [activeId, setActiveId] = React.useState("");
  const listId = React.useId();
  const listRef = React.useRef<HTMLDivElement>(null);

  return (
    <DialogPrimitive.Root data-slot="command-palette" {...props}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          aria-modal="true"
          data-slot="command-palette-content"
          className={cn("palette kiso-react-palette", className)}
        >
          <VisuallyHidden.Root asChild>
            <DialogPrimitive.Title>{label}</DialogPrimitive.Title>
          </VisuallyHidden.Root>
          <CommandPaletteContext.Provider
            value={{ activeId, setActiveId, listId, listRef }}
          >
            {children}
          </CommandPaletteContext.Provider>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}

function CommandPaletteInput({
  className,
  onKeyDown,
  ...props
}: React.ComponentProps<"input">) {
  const { activeId, setActiveId, listId, listRef } = useCommandPalette();

  // The query changes the list under the highlight, so re-anchor it every
  // render rather than tracking an index that the filter invalidates.
  React.useEffect(() => {
    const visible = items(listRef.current);
    if (!visible.some((item) => item.id === activeId)) {
      setActiveId(visible[0]?.id ?? "");
    }
  });

  function move(event: React.KeyboardEvent<HTMLInputElement>) {
    const visible = items(listRef.current);
    const index = visible.findIndex((item) => item.id === activeId);

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!visible.length) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = visible[(index + step + visible.length) % visible.length];
      setActiveId(next.id);
      next.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      event.preventDefault();
      visible[index]?.click();
    }
    onKeyDown?.(event);
  }

  return (
    <div className="palette-input" data-slot="command-palette-input">
      <svg
        className="icon muted"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="4.5" />
        <path d="m10.5 10.5 3 3" />
      </svg>
      <input
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={activeId || undefined}
        aria-autocomplete="list"
        autoComplete="off"
        autoFocus
        onKeyDown={move}
        className={className}
        {...props}
      />
    </div>
  );
}

function CommandPaletteList({
  className,
  "aria-label": ariaLabel = "Commands",
  ...props
}: React.ComponentProps<"div">) {
  const { listId, listRef } = useCommandPalette();

  return (
    <div
      id={listId}
      ref={listRef}
      role="listbox"
      aria-label={ariaLabel}
      data-slot="command-palette-list"
      className={cn("palette-list", className)}
      {...props}
    />
  );
}

function CommandPaletteGroup({
  className,
  heading,
  children,
  ...props
}: React.ComponentProps<"div"> & { heading: string }) {
  const headingId = React.useId();

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      data-slot="command-palette-group"
      className={cn("", className)}
      {...props}
    >
      <p id={headingId} className="t-caps menu-label">
        {heading}
      </p>
      {children}
    </div>
  );
}

function CommandPaletteItem({
  className,
  disabled = false,
  onSelect,
  onClick,
  ...props
}: React.ComponentProps<"div"> & { disabled?: boolean; onSelect?: () => void }) {
  const id = React.useId();
  const { activeId, setActiveId } = useCommandPalette();

  return (
    <div
      id={id}
      role="option"
      data-slot="command-palette-item"
      aria-selected={activeId === id}
      aria-disabled={disabled || undefined}
      className={cn("menu-item", className)}
      onPointerMove={() => !disabled && setActiveId(id)}
      onClick={(event) => {
        if (disabled) return;
        onSelect?.();
        onClick?.(event);
      }}
      {...props}
    />
  );
}

function CommandPaletteEmpty({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="command-palette-empty"
      className={cn("menu-item muted", className)}
      {...props}
    />
  );
}

export {
  CommandPalette,
  CommandPaletteInput,
  CommandPaletteList,
  CommandPaletteGroup,
  CommandPaletteItem,
  CommandPaletteEmpty,
};
