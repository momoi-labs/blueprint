"use client";

import * as React from "react";
import { clsx as cn } from "clsx";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Spinner } from "./spinner.js";

export type ComboboxOption = {
  value: string;
  label: string;
  description?: string;
  /** Short text on the right of the label, such as a type or a unit. */
  note?: string;
  group?: string;
};

export type ComboboxProps = Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "size" | "role"
> & {
  options: readonly ComboboxOption[];
  /** The picked option value, or null when the text names no option. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** The text in the input. */
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Replace the match rule. The default matches the label and the description. */
  filter?: (option: ComboboxOption, query: string) => boolean;
  /** Shown when no option matches. */
  emptyText?: React.ReactNode | ((query: string) => React.ReactNode);
  /** The product is resolving options. The list shows this state, not stale options. */
  loading?: boolean;
  loadingText?: string;
  controlSize?: "sm" | "md" | "lg" | "xl";
  /** Accessible name of the list. Defaults to the input's label text. */
  listLabel?: string;
  /** Show the input text and option labels in the mono font, for identifiers such as setting names. */
  mono?: boolean;
};

export function defaultComboboxFilter(option: ComboboxOption, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return option.label.toLowerCase().includes(q) || !!option.description?.toLowerCase().includes(q);
}

function useControllable<T>(controlled: T | undefined, initial: T, onChange?: (value: T) => void) {
  const [own, setOwn] = React.useState(initial);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : own;
  const set = React.useCallback((next: T) => {
    if (!isControlled) setOwn(next);
    onChange?.(next);
  }, [isControlled, onChange]);
  return [value, set] as const;
}

/** A searchable single choice for a long list. The product owns loading and validation. */
export function Combobox({
  id: providedId, className, options, value: valueProp, defaultValue = null, onValueChange,
  query: queryProp, defaultQuery, onQueryChange, filter = defaultComboboxFilter,
  emptyText = (q: string) => (q.trim() ? `Nothing matches "${q.trim()}".` : "No options."),
  loading = false, loadingText = "Loading options", controlSize, listLabel, mono = false, disabled,
  onFocus, onBlur, onClick, onKeyDown, ...props
}: ComboboxProps) {
  const generatedId = React.useId();
  const id = providedId ?? generatedId;
  const listId = `${id}-list`;
  const labelOf = (v: string | null) => options.find(option => option.value === v)?.label ?? "";
  const [value, setValue] = useControllable<string | null>(valueProp, defaultValue, onValueChange);
  const [query, setQuery] = useControllable<string>(queryProp, defaultQuery ?? labelOf(valueProp !== undefined ? valueProp : defaultValue), onQueryChange);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const anchor = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const input = React.useRef<HTMLInputElement>(null);

  // A picked option shows its label. While the text equals that label, the whole list stays visible.
  const showAll = value !== null && query === labelOf(value);
  const matches = React.useMemo(
    () => (showAll ? [...options] : options.filter(option => filter(option, query))),
    [options, filter, query, showAll],
  );
  // Group in order of first appearance, so each group label shows once.
  const groups = React.useMemo(() => {
    const byName = new Map<string, ComboboxOption[]>();
    for (const option of matches) {
      const key = option.group ?? "";
      byName.set(key, [...(byName.get(key) ?? []), option]);
    }
    return [...byName.entries()];
  }, [matches]);
  const flat = groups.flatMap(([, items]) => items);
  const visible = open && !disabled;
  const current = Math.min(active, flat.length - 1);
  const ready = !loading && flat.length > 0;
  const optionId = (index: number) => `${id}-option-${index}`;

  // Keep an uncontrolled text in step with a value the product sets or clears.
  const lastValue = React.useRef(value);
  React.useEffect(() => {
    const previous = lastValue.current;
    if (value === previous) return;
    lastValue.current = value;
    if (value !== null && query !== labelOf(value)) setQuery(labelOf(value));
    else if (value === null && previous !== null && query === labelOf(previous)) setQuery("");
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (visible && ready) listRef.current?.querySelector(`#${CSS.escape(optionId(current))}`)?.scrollIntoView({ block: "nearest" });
  }, [visible, ready, current]); // eslint-disable-line react-hooks/exhaustive-deps

  function show() {
    if (open || disabled) return;
    const at = flat.findIndex(option => option.value === value);
    setActive(Math.max(0, at));
    setOpen(true);
  }
  function pick(option: ComboboxOption) {
    setValue(option.value);
    setQuery(option.label);
    setOpen(false);
    input.current?.focus();
  }
  function typed(text: string) {
    setQuery(text);
    const exact = options.find(option => option.label === text.trim());
    if ((exact?.value ?? null) !== value) setValue(exact?.value ?? null);
    setActive(0);
    setOpen(true);
  }
  function keys(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    const last = flat.length - 1;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!visible) return show();
      setActive(Math.max(0, Math.min(last, current + (event.key === "ArrowDown" ? 1 : -1))));
    } else if ((event.key === "Home" || event.key === "End") && visible && ready) {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : last);
    } else if (event.key === "Enter" && visible && ready) {
      event.preventDefault();
      pick(flat[current]);
    } else if (event.key === "Escape" && visible) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  }

  let index = -1;
  return (
    <PopoverPrimitive.Root open={visible} onOpenChange={next => { if (!next) setOpen(false); }}>
      <PopoverPrimitive.Anchor asChild>
        <div ref={anchor} data-slot="combobox" data-mono={mono || undefined} className={cn("combobox", className)}>
          <input
            {...props}
            ref={input}
            id={id}
            type="text"
            role="combobox"
            className={cn("input", mono && "mono")}
            data-control-size={controlSize ?? (props as { "data-control-size"?: string })["data-control-size"]}
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            aria-autocomplete="list"
            aria-expanded={visible}
            aria-controls={visible ? listId : undefined}
            aria-activedescendant={visible && ready ? optionId(current) : undefined}
            aria-busy={loading || undefined}
            value={query}
            onChange={event => typed(event.target.value)}
            onFocus={event => { onFocus?.(event); show(); }}
            onClick={event => { onClick?.(event); show(); }}
            onBlur={event => { onBlur?.(event); setOpen(false); }}
            onKeyDown={keys}
          />
        </div>
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          data-slot="combobox-content"
          className="menu combobox-content kiso-react-floating"
          data-mono={mono || undefined}
          role="presentation"
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={8}
          onOpenAutoFocus={event => event.preventDefault()}
          onCloseAutoFocus={event => event.preventDefault()}
          onMouseDown={event => event.preventDefault()}
          onInteractOutside={event => { if (anchor.current?.contains(event.target as Node)) event.preventDefault(); }}
        >
          <div ref={listRef} id={listId} role="listbox" aria-label={listLabel ?? (input.current?.labels?.[0]?.textContent || undefined)} aria-busy={loading || undefined}>
            {loading ? (
              <div className="combobox-message" role="status"><Spinner size="sm" />{loadingText}</div>
            ) : !flat.length ? (
              <div className="combobox-message" role="status">{typeof emptyText === "function" ? emptyText(query) : emptyText}</div>
            ) : groups.map(([group, items]) => {
              const rendered = items.map(option => {
                index += 1;
                const at = index;
                return (
                  <div
                    key={option.value}
                    id={optionId(at)}
                    role="option"
                    aria-selected={at === current}
                    data-current={option.value === value || undefined}
                    className="combobox-option"
                    onPointerMove={() => { if (at !== current) setActive(at); }}
                    onClick={() => pick(option)}
                  >
                    <span className="combobox-option-head">
                      <span className="combobox-option-label">{option.label}</span>
                      {option.note && <span className="combobox-option-note">{option.note}</span>}
                    </span>
                    {option.description && <span className="combobox-option-description">{option.description}</span>}
                  </div>
                );
              });
              if (!group) return <React.Fragment key="">{rendered}</React.Fragment>;
              const groupId = `${id}-group-${encodeURIComponent(group).replace(/%/g, "")}`;
              return (
                <div key={group} role="group" aria-labelledby={groupId}>
                  <div id={groupId} className="combobox-group-label t-caps">{group}</div>
                  {rendered}
                </div>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
