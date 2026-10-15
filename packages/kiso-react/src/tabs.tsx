// Adapted from shadcn/ui new-york-v4. See ../SHADCN-LICENSE.
"use client";

import * as React from "react";
import { clsx as cn } from "clsx";
import { ChevronDown } from "lucide-react";
import { Tabs as TabsPrimitive } from "radix-ui";

type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root> & {
  /**
   * Below 1024px, show each panel under a header of its own, one open at a
   * time, instead of a strip of triggers that cannot fit a phone. The panels
   * are the same elements in both layouts, so crossing the breakpoint (a
   * phone turned sideways) keeps what they hold: an edited form, a terminal.
   */
  sections?: boolean;
};

function Tabs({ sections = false, ...props }: TabsProps) {
  if (!sections) return <TabsPrimitive.Root data-slot="tabs" {...props} />;
  return <SectionedTabs {...props} />;
}

type Trigger = { value: string; label: React.ReactNode; disabled?: boolean };

/** Children with fragments opened, so a conditional group still counts.
 *  Keys carry the fragment's, so two groups never share one. */
function flatten(children: React.ReactNode, prefix = ""): React.ReactNode[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement<{ children?: React.ReactNode }>(child)) return [child];
    if (child.type === React.Fragment) return flatten(child.props.children, `${prefix}${child.key}/`);
    return [prefix ? React.cloneElement(child, { key: `${prefix}${child.key}` }) : child];
  });
}

function SectionedTabs({
  value: controlled,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [inner, setInner] = React.useState(defaultValue);
  const value = controlled ?? inner;
  // Closing the open section is a phone's own state: the selected tab stays,
  // so a wider screen never shows a card with no panel. It belongs to the
  // value it closed, so any other way to a panel (a tab, a link in a panel
  // that sets the value) opens it.
  const [collapsedFor, setCollapsedFor] = React.useState<string | undefined>();
  const [shown, setShown] = React.useState(value);
  if (shown !== value) {
    setShown(value);
    setCollapsedFor(undefined);
  }
  const collapsed = value !== undefined && collapsedFor === value;
  const select = (next: string) => {
    if (controlled === undefined) setInner(next);
    onValueChange?.(next);
  };

  const items = flatten(children);
  const triggers: Trigger[] = [];
  for (const item of items) {
    if (!React.isValidElement<{ children?: React.ReactNode }>(item) || item.type !== TabsList) continue;
    for (const trigger of flatten(item.props.children)) {
      if (!React.isValidElement<React.ComponentProps<typeof TabsPrimitive.Trigger>>(trigger) || trigger.type !== TabsTrigger) continue;
      triggers.push({ value: trigger.props.value, label: trigger.props.children, disabled: trigger.props.disabled });
    }
  }

  const laid: React.ReactNode[] = [];
  for (const item of items) {
    if (React.isValidElement<React.ComponentProps<typeof TabsPrimitive.Content>>(item) && item.type === TabsContent) {
      const trigger = triggers.find((one) => one.value === item.props.value);
      if (trigger) {
        const open = trigger.value === value && !collapsed;
        laid.push(
          <button
            key={`section-${trigger.value}`}
            type="button"
            data-slot="tabs-section"
            className="tabs-section"
            data-state={open ? "open" : "closed"}
            aria-expanded={open}
            disabled={trigger.disabled}
            onClick={() => {
              if (trigger.value !== value) select(trigger.value);
              else setCollapsedFor(collapsed ? undefined : value);
            }}
          >
            <span className="tabs-section-label">{trigger.label}</span>
            <ChevronDown className="icon tabs-section-chevron" aria-hidden="true" />
          </button>,
        );
      }
    }
    laid.push(item);
  }

  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-sections="true"
      data-collapsed={collapsed ? "true" : undefined}
      className={className}
      value={value}
      onValueChange={select}
      {...props}
    >
      {laid}
    </TabsPrimitive.Root>
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("tabs", className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn("", className)}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
