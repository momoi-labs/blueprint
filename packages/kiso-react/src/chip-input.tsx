"use client";

import * as React from "react";
import { clsx as cn } from "clsx";

// One field holding several structured values. The component owns the box, the
// chips, and the combobox keys; the product owns what a chip means, which
// suggestions match, and which options a chip accepts.
const ChipInputContext = React.createContext<{
  activeId: string;
  setActiveId: (id: string) => void;
  listId: string;
  listRef: React.RefObject<HTMLDivElement | null>;
  fieldRef: React.RefObject<HTMLInputElement | null>;
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

function useChipInput() {
  const context = React.useContext(ChipInputContext);
  if (!context) {
    throw new Error("ChipInput parts must be used inside <ChipInput>");
  }
  return context;
}

function options(list: HTMLElement | null) {
  return Array.from(
    list?.querySelectorAll<HTMLElement>(
      '[data-slot="chip-input-option"]:not([aria-disabled="true"])',
    ) ?? [],
  );
}

function ChipInput({ className, ...props }: React.ComponentProps<"div">) {
  const [activeId, setActiveId] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const listId = React.useId();
  const listRef = React.useRef<HTMLDivElement>(null);
  const fieldRef = React.useRef<HTMLInputElement>(null);
  const value = React.useMemo(
    () => ({ activeId, setActiveId, listId, listRef, fieldRef, open, setOpen }),
    [activeId, listId, open],
  );

  return (
    <ChipInputContext.Provider value={value}>
      <div
        data-slot="chip-input"
        className={cn("chip-input", className)}
        {...props}
      />
    </ChipInputContext.Provider>
  );
}

// The box is the field: clicking its empty space puts the caret back where
// typing continues, the way a single-line input behaves.
function ChipInputBox({
  className,
  disabled = false,
  onMouseDown,
  ...props
}: React.ComponentProps<"div"> & { disabled?: boolean }) {
  const { fieldRef } = useChipInput();

  return (
    <div
      data-slot="chip-input-box"
      data-disabled={disabled || undefined}
      className={cn("chip-input-box", className)}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !disabled) {
          event.preventDefault();
          fieldRef.current?.focus();
        }
        onMouseDown?.(event);
      }}
      {...props}
    />
  );
}

function ChipInputField({
  className,
  onKeyDown,
  onRemoveLast,
  ...props
}: React.ComponentProps<"input"> & { onRemoveLast?: () => void }) {
  const { activeId, setActiveId, listId, listRef, fieldRef, open } =
    useChipInput();

  // Typing changes the list under the highlight, so re-anchor it every render
  // instead of tracking an index the filter invalidates.
  React.useEffect(() => {
    const visible = options(listRef.current);
    if (!visible.some((option) => option.id === activeId)) {
      setActiveId(visible[0]?.id ?? "");
    }
  });

  function keys(event: React.KeyboardEvent<HTMLInputElement>) {
    const visible = options(listRef.current);
    const index = visible.findIndex((option) => option.id === activeId);

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!visible.length) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = visible[(index + step + visible.length) % visible.length];
      setActiveId(next.id);
      next.scrollIntoView({ block: "nearest" });
    } else if ((event.key === "Enter" || event.key === "Tab") && index >= 0) {
      // Tab only commits a highlighted suggestion; with none it still leaves
      // the field, so the box never traps the keyboard. Enter with no
      // highlight falls through to the product, which may take the query.
      event.preventDefault();
      visible[index]?.click();
    } else if (
      event.key === "Backspace" &&
      event.currentTarget.value === "" &&
      onRemoveLast
    ) {
      event.preventDefault();
      onRemoveLast();
    }
    onKeyDown?.(event);
  }

  return (
    <input
      ref={fieldRef}
      data-slot="chip-input-field"
      role="combobox"
      aria-expanded={open}
      aria-controls={listId}
      aria-activedescendant={activeId || undefined}
      aria-autocomplete="list"
      autoComplete="off"
      onKeyDown={keys}
      className={cn("chip-input-field", className)}
      {...props}
    />
  );
}

function ChipInputList({
  className,
  "aria-label": ariaLabel = "Suggestions",
  ...props
}: React.ComponentProps<"div">) {
  const { listId, listRef, setOpen } = useChipInput();

  React.useEffect(() => {
    setOpen(true);
    return () => setOpen(false);
  }, [setOpen]);

  return (
    <div
      id={listId}
      ref={listRef}
      role="listbox"
      aria-label={ariaLabel}
      data-slot="chip-input-list"
      className={cn("menu chip-input-list", className)}
      {...props}
    />
  );
}

function ChipInputOption({
  className,
  disabled = false,
  onSelect,
  onClick,
  ...props
}: React.ComponentProps<"div"> & {
  disabled?: boolean;
  onSelect?: () => void;
}) {
  const id = React.useId();
  const { activeId, setActiveId } = useChipInput();

  return (
    <div
      id={id}
      role="option"
      data-slot="chip-input-option"
      aria-selected={activeId === id}
      aria-disabled={disabled || undefined}
      className={cn("menu-item", className)}
      onPointerMove={() => !disabled && setActiveId(id)}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        if (disabled) return;
        onSelect?.();
        onClick?.(event);
      }}
      {...props}
    />
  );
}

function ChipInputEmpty({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="chip-input-empty"
      className={cn("menu-item muted", className)}
      {...props}
    />
  );
}

function Chip({
  className,
  invalid = false,
  ...props
}: React.ComponentProps<"span"> & { invalid?: boolean }) {
  return (
    <span
      data-slot="chip"
      data-state={invalid ? "invalid" : undefined}
      className={cn("chip", className)}
      {...props}
    />
  );
}

// The leading segment: what kind of value this is, when that is a separate
// fact from its name. Reads as the caller in `npm(t3, latest)`.
function ChipScope({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="chip-scope"
      className={cn("chip-scope", className)}
      {...props}
    />
  );
}

function ChipName({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="chip-name"
      className={cn("chip-name truncate", className)}
      {...props}
    />
  );
}

// Every editable segment behaves the same: press it, it becomes an input
// sized to its text, Enter or the check confirms, Escape restores.
function EditableSegment({
  slot,
  className,
  value,
  placeholder,
  display,
  onCommit,
  editable = true,
  editLabel,
  confirmLabel,
  maxWidth = 48,
  ...props
}: Omit<React.ComponentProps<"button">, "value"> & {
  slot: string;
  value: string;
  placeholder?: string;
  display?: React.ReactNode;
  onCommit?: (value: string) => void;
  editable?: boolean;
  editLabel?: string;
  confirmLabel?: string;
  maxWidth?: number;
}) {
  const [draft, setDraft] = React.useState<string | null>(null);

  if (!editable || !onCommit) {
    return (
      <span data-slot={slot} className={cn(className)}>
        {value ? (display ?? value) : placeholder}
      </span>
    );
  }

  function commit(next: string | null) {
    if (next !== null) onCommit?.(next.trim());
    setDraft(null);
  }

  if (draft !== null) {
    return (
      <>
        <input
          data-slot={`${slot}-input`}
          className={cn(className, "is-editing")}
          aria-label={editLabel}
          value={draft}
          autoFocus
          size={1}
          style={{
            width: `${Math.min(Math.max(draft.length + 1, 6), maxWidth)}ch`,
          }}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(draft);
            } else if (event.key === "Escape") {
              event.preventDefault();
              setDraft(null);
            }
            event.stopPropagation();
          }}
        />
        <button
          type="button"
          className="chip-action"
          aria-label={confirmLabel}
          // Commit before the input's blur can unmount this button.
          onMouseDown={(event) => {
            event.preventDefault();
            commit(draft);
          }}
        >
          <CheckIcon />
        </button>
      </>
    );
  }

  return (
    <button
      type="button"
      data-slot={slot}
      data-empty={value ? undefined : "true"}
      className={cn(className)}
      aria-label={editLabel}
      onClick={() => setDraft(value)}
      {...props}
    >
      {value ? (display ?? value) : placeholder}
    </button>
  );
}

// The version is the part people revise most, so it edits in place instead of
// forcing a remove and a retype.
function ChipValue({
  className,
  value,
  editLabel,
  confirmLabel = "Confirm value",
  ...props
}: Omit<React.ComponentProps<typeof EditableSegment>, "slot"> & {
  value: string;
}) {
  return (
    <EditableSegment
      slot="chip-value"
      className={cn("chip-value", className)}
      value={value}
      editLabel={editLabel ?? `Edit value, currently ${value}`}
      confirmLabel={confirmLabel}
      maxWidth={16}
      {...props}
    />
  );
}

// One segment per option, divided like the rest, written the way the config
// file writes it. A list keeps its brackets so `os=linux` and
// `allow_builds=[node-pty, esbuild]` read as the same kind of fact.
function ChipOption({
  className,
  name,
  value,
  label,
  editLabel,
  confirmLabel,
  ...props
}: Omit<
  React.ComponentProps<typeof EditableSegment>,
  "slot" | "value" | "display"
> & {
  name: string;
  value: string | string[];
  label?: string;
}) {
  const list = Array.isArray(value);
  const shown = list ? `[${(value as string[]).join(", ")}]` : value;
  const text = `${name}=${shown}`;
  const where = label ? ` on ${label}` : "";

  return (
    <EditableSegment
      slot="chip-option"
      className={cn("chip-option", className)}
      value={text}
      display={
        <>
          <span className="chip-option-name">{name}</span>
          <span className="chip-option-mark">=</span>
          {list ? <span className="chip-option-mark">[</span> : null}
          <span className="chip-option-value">
            {list ? (value as string[]).join(", ") : value}
          </span>
          {list ? <span className="chip-option-mark">]</span> : null}
        </>
      }
      editLabel={editLabel ?? `Edit ${name}${where}, currently ${shown}`}
      confirmLabel={confirmLabel ?? `Confirm ${name}${where}`}
      {...props}
    />
  );
}

// The segment that takes a new option. It stays at the end of the chip so the
// place to add one is where the last one ended.
function ChipOptionAdd({
  className,
  label,
  placeholder = "+",
  editLabel,
  confirmLabel,
  ...props
}: Omit<
  React.ComponentProps<typeof EditableSegment>,
  "slot" | "value" | "display"
> & {
  label: string;
}) {
  return (
    <EditableSegment
      slot="chip-option-add"
      className={cn("chip-option", className)}
      value=""
      placeholder={placeholder}
      editLabel={editLabel ?? `Add an option to ${label}`}
      confirmLabel={confirmLabel ?? `Confirm the new option on ${label}`}
      {...props}
    />
  );
}

function ChipRemove({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="chip-remove"
      className={cn("chip-action", className)}
      {...props}
    >
      <CloseIcon />
    </button>
  );
}

function CheckIcon() {
  return (
    <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  );
}

export {
  Chip,
  ChipInput,
  ChipInputBox,
  ChipInputEmpty,
  ChipInputField,
  ChipInputList,
  ChipInputOption,
  ChipName,
  ChipOption,
  ChipOptionAdd,
  ChipRemove,
  ChipScope,
  ChipValue,
};
