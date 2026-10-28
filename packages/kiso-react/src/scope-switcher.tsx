"use client";

import * as React from "react";
import { clsx as cn } from "clsx";
import { Check, ChevronDown, Layers, Search } from "lucide-react";
import { Popover as PopoverPrimitive, Slot } from "radix-ui";

import { Button } from "./button.js";
import { Skeleton } from "./skeleton.js";
import { Spinner } from "./spinner.js";

// Each level of the current scope is a trigger that opens a listbox of its
// choices. Choosing calls the product, which owns the URL: options are not
// links. Below 700px the levels move into one compact popup, so Header stays
// one row and focus order matches what the person sees.

type ScopeOption = {
  value: string;
  label: string;
  description?: string;
  group?: string;
};

type ScopeSegmentLabels = {
  /** Popup name. Defaults to "Switch <level>". */
  dialog?: string;
  /** Listbox name. Defaults to the level. */
  list?: string;
  /** Filter name. Defaults to "Filter <list>". */
  filter?: string;
  loading?: string;
  error?: string;
  retry?: string;
  /** Status and trigger text when the level has no choices. */
  empty?: string;
  noMatches?: (query: string) => string;
  /** Trigger name suffix while the current name is unknown. */
  unknown?: string;
};

type ScopeSegmentProps = {
  /** Level name, the start of the trigger's accessible name. */
  level: string;
  value?: string;
  options: ScopeOption[];
  all?: { value: string; label: string };
  /** Current name while options are not loaded, for example from the URL. */
  currentLabel?: string;
  searchable?: boolean;
  status?: "ready" | "loading" | "error";
  onRetry?: () => void;
  onValueChange: (value: string) => void;
  destinations?: React.ReactNode;
  labels?: ScopeSegmentLabels;
  className?: string;
};

const NARROW = "(max-width: 699px)";

function subscribe(callback: () => void) {
  const query = window.matchMedia(NARROW);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function useNarrow() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

const ScopeContext = React.createContext<{
  compact: boolean;
  closeCompact: () => void;
  /** Leaves the compact popup forward, past its last level. */
  tabOutCompact: () => void;
  levelsRef: React.RefObject<HTMLElement | null> | null;
}>({ compact: false, closeCompact: () => {}, tabOutCompact: () => {}, levelsRef: null });

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function tabbables(root: ParentNode) {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE))
    .filter((element) => !element.closest("[inert]") && element.getClientRects().length > 0);
}

// Focus the first tabbable after `from` in document order, skipping the
// popup that is closing. Radix portals popups to the end of the document,
// so plain Tab would leave focus there instead of after the trigger.
function nextTabbable(from: HTMLElement | null, skip: HTMLElement | null, within: ParentNode = document) {
  if (!from) return null;
  const all = tabbables(within).filter((element) => !skip?.contains(element));
  const index = all.indexOf(from);
  return index === -1 ? null : all[index + 1] ?? null;
}

// Tab past the last control closes the popup and moves on from the trigger;
// Shift+Tab before the first closes it and returns to the trigger.
function boundaryTab(event: React.KeyboardEvent<HTMLElement>, content: HTMLElement | null) {
  if (event.key !== "Tab" || !content || !content.contains(event.target as Node)) return null;
  const focusable = tabbables(content);
  if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) return "forward";
  if (event.shiftKey && document.activeElement === focusable[0]) return "backward";
  return null;
}

const SegmentContext = React.createContext<{ close: () => void } | null>(null);

function currentName(props: ScopeSegmentProps) {
  const { value, options, all, currentLabel, status = "ready", labels } = props;
  if (all && value === all.value) return all.label;
  const option = options.find((item) => item.value === value);
  if (option) return option.label;
  if (currentLabel) return currentLabel;
  if (status === "ready" && options.length === 0 && labels?.empty) return labels.empty;
  return undefined;
}

function optionId(base: string, value: string) {
  return `${base}-${value.replace(/[^A-Za-z0-9_-]/g, (c) => `_${c.charCodeAt(0).toString(16)}`)}`;
}

function matches(option: ScopeOption, query: string) {
  const needle = query.trim().toLocaleLowerCase();
  return !needle
    || option.label.toLocaleLowerCase().includes(needle)
    || Boolean(option.description?.toLocaleLowerCase().includes(needle));
}

function ScopeSwitcher({
  className,
  children,
  "aria-label": ariaLabel = "Scope",
  ...props
}: React.ComponentProps<"nav">) {
  const narrow = useNarrow();
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const levelsRef = React.useRef<HTMLDivElement>(null);
  const tabForward = React.useRef(false);
  const tabOutCompact = () => { tabForward.current = true; setOpen(false); };
  const segments = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<ScopeSegmentProps> =>
      React.isValidElement(child) && child.type === ScopeSegment,
  );
  const names = segments.map((segment) => currentName(segment.props) ?? "…");
  const deepest = names[names.length - 1] ?? "";

  if (narrow) {
    return (
      <nav data-slot="scope-switcher" data-compact="" aria-label={ariaLabel} className={cn("scope", className)} {...props}>
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
          <PopoverPrimitive.Trigger asChild>
            <Button ref={triggerRef} variant="ghost" className="scope-compact" aria-label={`${ariaLabel}: ${names.join(" / ")}`}>
              <Layers className="icon icon-sm" aria-hidden="true" />
              <span className="scope-name">{deepest}</span>
              <ChevronDown className="icon icon-sm" aria-hidden="true" />
            </Button>
          </PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              ref={levelsRef}
              aria-label={ariaLabel}
              align="start"
              sideOffset={4}
              collisionPadding={16}
              className="scope-popover kiso-react-floating"
              onKeyDown={(event) => {
                const edge = boundaryTab(event, levelsRef.current);
                if (!edge) return;
                event.preventDefault();
                if (edge === "forward") tabOutCompact(); else setOpen(false);
              }}
              onCloseAutoFocus={(event) => {
                if (!tabForward.current) return;
                tabForward.current = false;
                const next = nextTabbable(triggerRef.current, levelsRef.current);
                if (next) { event.preventDefault(); next.focus(); }
              }}
            >
              <ScopeContext.Provider value={{ compact: true, closeCompact: () => setOpen(false), tabOutCompact, levelsRef }}>
                <ol className="scope-levels">{children}</ol>
              </ScopeContext.Provider>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </nav>
    );
  }

  return (
    <nav data-slot="scope-switcher" aria-label={ariaLabel} className={cn("scope", className)} {...props}>
      <ScopeContext.Provider value={{ compact: false, closeCompact: () => {}, tabOutCompact: () => {}, levelsRef: null }}>
        <ol className="scope-path">
          {segments.map((segment, index) => (
            <React.Fragment key={segment.key ?? index}>
              {index > 0 && <li className="scope-sep" aria-hidden="true">/</li>}
              {segment}
            </React.Fragment>
          ))}
        </ol>
      </ScopeContext.Provider>
    </nav>
  );
}

function ScopeSegment(props: ScopeSegmentProps) {
  const {
    level, value, options, all, searchable = false, status = "ready", onRetry,
    onValueChange, destinations, labels = {}, className,
  } = props;
  const { compact, closeCompact, tabOutCompact, levelsRef } = React.useContext(ScopeContext);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const tabForward = React.useRef(false);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeValue, setActiveValue] = React.useState<string | null>(null);
  const base = React.useId();
  const listId = `${base}-list`;
  const statusId = `${base}-status`;
  const contentRef = React.useRef<HTMLDivElement>(null);
  const targetRef = React.useRef<HTMLElement | null>(null);
  const composing = React.useRef(false);
  const typed = React.useRef({ text: "", at: 0 });
  const leavingCompact = React.useRef(false);

  const listName = labels.list ?? level;
  const name = currentName(props);
  const ready = status === "ready";
  const filtering = searchable && query.trim() !== "";
  const named = ready ? options.filter((option) => matches(option, filtering ? query : "")) : [];
  const showAll = Boolean(all) && ready && options.length > 0 && !filtering;
  const visible: ScopeOption[] = [...(showAll && all ? [all] : []), ...named];
  const visibleValues = visible.map((option) => option.value);
  const active = activeValue !== null && visibleValues.includes(activeValue)
    ? activeValue
    : value !== undefined && visibleValues.includes(value) ? value : visibleValues[0] ?? null;
  const activeId = active === null ? undefined : optionId(base, active);

  let statusText = "";
  if (status === "loading") statusText = labels.loading ?? `Loading ${listName.toLocaleLowerCase()}`;
  else if (status === "error") statusText = labels.error ?? `Couldn't load ${listName.toLocaleLowerCase()}.`;
  else if (options.length === 0) statusText = labels.empty ?? `No ${listName.toLocaleLowerCase()}.`;
  else if (filtering && named.length === 0) statusText = labels.noMatches?.(query.trim()) ?? `No ${listName.toLocaleLowerCase()} match "${query.trim()}"`;

  function changeOpen(next: boolean) {
    setOpen(next);
    typed.current = { text: "", at: 0 };
    if (!next) { setQuery(""); setActiveValue(null); }
    else setActiveValue(value ?? null);
  }

  function focusTarget() {
    targetRef.current?.focus({ preventScroll: true });
  }

  function choose(next: string) {
    leavingCompact.current = compact;
    changeOpen(false);
    if (next !== value) onValueChange(next);
    if (compact) closeCompact();
  }

  // Status changes never move focus, but a focused element that disappears
  // (Retry when loading starts) must not drop focus to the page.
  React.useEffect(() => {
    if (!open) return;
    const focused = document.activeElement;
    if (!focused || focused === document.body) focusTarget();
  }, [open, status, visible.length]);

  React.useEffect(() => {
    if (!open || !activeId) return;
    document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [open, activeId]);

  function move(step: number) {
    if (!visible.length) return;
    const index = active === null ? -1 : visibleValues.indexOf(active);
    const next = index === -1
      ? (step > 0 ? 0 : visible.length - 1)
      : (index + step + visible.length) % visible.length;
    setActiveValue(visibleValues[next]);
  }

  function typeahead(key: string) {
    const now = Date.now();
    const text = now - typed.current.at > 500 ? key : typed.current.text + key;
    typed.current = { text, at: now };
    const needle = text.toLocaleLowerCase();
    const start = active === null ? 0 : visibleValues.indexOf(active) + (text.length === 1 ? 1 : 0);
    const order = [...visible.slice(start), ...visible.slice(0, start)];
    const found = order.find((option) => option.label.toLocaleLowerCase().startsWith(needle));
    if (found) setActiveValue(found.value);
  }

  function onListKeyDown(event: React.KeyboardEvent<HTMLElement>, inInput: boolean) {
    if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (!inInput && (event.key === "Home" || event.key === "End")) {
      event.preventDefault();
      if (visible.length) setActiveValue(visibleValues[event.key === "Home" ? 0 : visible.length - 1]);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active !== null) choose(active);
    } else if (!inInput && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== " ") {
      typeahead(event.key);
    } else if (!inInput && event.key === " ") {
      event.preventDefault();
      if (active !== null) choose(active);
    }
  }

  function onContentKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const edge = boundaryTab(event, contentRef.current);
    if (!edge) return;
    event.preventDefault();
    event.stopPropagation();
    tabForward.current = edge === "forward";
    changeOpen(false);
  }

  const grouped: { group?: string; items: ScopeOption[] }[] = [];
  for (const option of named) {
    const bucket = grouped.find((entry) => entry.group === option.group);
    if (bucket) bucket.items.push(option);
    else grouped.push({ group: option.group, items: [option] });
  }
  grouped.sort((a, b) => Number(a.group !== undefined) - Number(b.group !== undefined));

  function renderOption(option: ScopeOption, isAll = false) {
    const id = optionId(base, option.value);
    return (
      <div
        key={option.value}
        id={id}
        role="option"
        aria-selected={option.value === value}
        data-active={option.value === active ? "" : undefined}
        data-all={isAll ? "" : undefined}
        className="scope-option"
        onPointerMove={() => setActiveValue(option.value)}
        onClick={() => choose(option.value)}
      >
        <span className="scope-option-text">
          <span>{option.label}</span>
          {option.description && <span className="scope-option-description">{option.description}</span>}
        </span>
        <Check className="icon icon-sm scope-check" aria-hidden="true" />
      </div>
    );
  }

  const unknown = name === undefined;
  const trigger = (
    <PopoverPrimitive.Trigger asChild>
      <Button
        ref={triggerRef}
        variant="ghost"
        className="scope-trigger"
        aria-label={unknown ? `${level}, ${labels.unknown ?? "loading"}` : `${level} ${name}`}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            changeOpen(true);
          }
        }}
      >
        {unknown ? <Skeleton /> : <span className="scope-name">{name}</span>}
        <ChevronDown className="icon icon-sm" aria-hidden="true" />
      </Button>
    </PopoverPrimitive.Trigger>
  );

  return (
    <li data-slot="scope-segment" className={cn(compact ? "scope-level" : "scope-segment", className)}>
      <PopoverPrimitive.Root open={open} onOpenChange={changeOpen}>
        {compact && <span className="scope-level-label" aria-hidden="true">{level}</span>}
        {trigger}
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            ref={contentRef}
            data-slot="scope-segment-content"
            aria-label={labels.dialog ?? `Switch ${level.toLocaleLowerCase()}`}
            align="start"
            sideOffset={4}
            collisionPadding={16}
            className="scope-popover kiso-react-floating"
            onOpenAutoFocus={(event) => { event.preventDefault(); focusTarget(); }}
            onCloseAutoFocus={(event) => {
              // A choice made from the compact popup returns focus to the
              // compact trigger, which the outer popover handles.
              if (leavingCompact.current) { event.preventDefault(); leavingCompact.current = false; return; }
              if (!tabForward.current) return;
              tabForward.current = false;
              event.preventDefault();
              // Inside the compact popup, move on to the next level, and
              // past the last one leave the compact popup too.
              const within = compact && levelsRef?.current ? levelsRef.current : document;
              const next = nextTabbable(triggerRef.current, contentRef.current, within);
              if (next) next.focus();
              else if (compact) { triggerRef.current?.focus(); tabOutCompact(); }
              else triggerRef.current?.focus();
            }}
            onEscapeKeyDown={(event) => {
              if (composing.current || event.isComposing || event.keyCode === 229) event.preventDefault();
            }}
            onKeyDown={onContentKeyDown}
          >
            {searchable && (
              <div className="scope-filter">
                <Search className="icon icon-sm muted" aria-hidden="true" />
                <input
                  ref={(element) => { targetRef.current = element; }}
                  role="combobox"
                  aria-label={labels.filter ?? `Filter ${listName.toLocaleLowerCase()}`}
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={activeId}
                  aria-describedby={statusText ? statusId : undefined}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={labels.filter ?? `Filter ${listName.toLocaleLowerCase()}`}
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); setActiveValue(null); }}
                  onKeyDown={(event) => onListKeyDown(event, true)}
                  onCompositionStart={() => { composing.current = true; }}
                  onCompositionEnd={() => { composing.current = false; }}
                />
              </div>
            )}
            <div
              id={listId}
              ref={searchable ? undefined : (element) => { targetRef.current = element; }}
              role="listbox"
              aria-label={listName}
              aria-busy={status === "loading" || undefined}
              aria-activedescendant={searchable ? undefined : activeId}
              aria-describedby={!searchable && statusText ? statusId : undefined}
              tabIndex={searchable ? -1 : 0}
              className="scope-list"
              onKeyDown={searchable ? undefined : (event) => onListKeyDown(event, false)}
            >
              {showAll && all && renderOption(all, true)}
              {grouped.map((entry, index) => entry.group === undefined
                ? entry.items.map((option) => renderOption(option))
                : (
                  <div key={`group-${index}`} role="group" aria-labelledby={`${base}-g${index}`} className="scope-group">
                    <div id={`${base}-g${index}`} role="presentation" className="scope-group-label t-caps">{entry.group}</div>
                    {entry.items.map((option) => renderOption(option))}
                  </div>
                ))}
            </div>
            <div id={statusId} role="status" className="scope-status" data-tone={status === "error" ? "danger" : undefined}>
              {status === "loading" && <Spinner size="sm" />}
              {statusText}
            </div>
            {status === "error" && onRetry && (
              <Button size="sm" className="scope-retry" onClick={() => { focusTarget(); onRetry(); }}>
                {labels.retry ?? "Retry"}
              </Button>
            )}
            {destinations && (
              <SegmentContext.Provider value={{ close: () => { leavingCompact.current = compact; changeOpen(false); if (compact) closeCompact(); } }}>
                <div className="scope-destinations">{destinations}</div>
              </SegmentContext.Provider>
            )}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </li>
  );
}

// A page about the level, such as "Manage projects". A real link, so
// open-in-new-tab works; asChild takes a router link.
function ScopeDestination({
  className,
  asChild = false,
  onClick,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const segment = React.useContext(SegmentContext);
  const Comp = asChild ? Slot.Root : "a";
  return (
    <Comp
      data-slot="scope-destination"
      className={cn("menu-item scope-destination", className)}
      onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) segment?.close();
      }}
      {...props}
    />
  );
}

export { ScopeSwitcher, ScopeSegment, ScopeDestination };
export type { ScopeOption, ScopeSegmentProps, ScopeSegmentLabels };
