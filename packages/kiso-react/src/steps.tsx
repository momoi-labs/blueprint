"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { clsx as cn } from "clsx";

export type StepsStatus = "upcoming" | "completed" | "error" | "disabled";
export type StepsItem = {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  status?: StepsStatus;
  navigable?: boolean;
  href?: string;
};

const defaultLabels = {
  upcoming: "Upcoming", current: "Current", completed: "Completed", error: "Needs attention",
  disabled: "Unavailable", expand: "View steps", collapse: "Hide steps",
  complete: "All steps completed", idle: "No current step",
  position: (position: number, total: number) => `Step ${position} of ${total}`,
};

export type StepsProps = Omit<ComponentProps<"nav">, "children"> & {
  label: string;
  items: readonly StepsItem[];
  current?: string | null;
  orientation?: "horizontal" | "vertical";
  responsive?: boolean;
  onStepChange?: (id: string) => void;
  labels?: Partial<typeof defaultLabels>;
};

export function Steps({ label, items, current, orientation = "horizontal", responsive = true,
  onStepChange, labels, className, ...props }: StepsProps) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const text = { ...defaultLabels, ...labels };
  const at = items.findIndex(item => item.id === current);
  const complete = items.length > 0 && items.every(item => item.status === "completed");

  return <nav {...props} aria-label={label} data-slot="steps" data-orientation={orientation}
    data-responsive={responsive} data-expanded={expanded} className={cn("steps", className)}>
    <div className="steps-compact">
      <p className="steps-summary">
        <span>{at >= 0 ? text.position(at + 1, items.length) : complete ? text.complete : text.idle}</span>
        {at >= 0 && <strong>{items[at]!.label}</strong>}
      </p>
      <div className="steps-segments" aria-hidden="true">
        {items.map(item => <span key={item.id} data-state={item.status ?? "upcoming"} data-current={item.id === current} />)}
      </div>
      <button type="button" className="steps-toggle" aria-controls={id} aria-expanded={expanded}
        onClick={() => setExpanded(value => !value)}>{expanded ? text.collapse : text.expand}</button>
    </div>
    <ol id={id} className="steps-list">
      {items.map((item, index) => {
        const status = item.status ?? "upcoming";
        const active = item.id === current;
        const canNavigate = status !== "disabled" && (item.href || (item.navigable && onStepChange));
        const content = <>
          <span className="steps-marker" aria-hidden="true">{status === "completed" ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 8 3 3 7-7" /></svg> : status === "disabled" ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3.5" y="7" width="9" height="7" rx="1" /><path d="M5.5 7V4a2.5 2.5 0 0 1 5 0v3" /></svg> : status === "error" ? "!" : index + 1}</span>
          <span className="steps-copy">
            <span className="steps-label">{item.label}</span>
            <span className="steps-state">{active ? `${text.current}${status === "error" ? `, ${text.error}` : ""}` : text[status]}</span>
            {item.description != null && <span className="steps-description">{item.description}</span>}
          </span>
        </>;
        return <li key={item.id} data-state={status} data-current={active} aria-current={active ? "step" : undefined}>
          {canNavigate && item.href ? <a className="steps-item" href={item.href}>{content}</a>
            : canNavigate ? <button type="button" className="steps-item" onClick={() => onStepChange?.(item.id)}>{content}</button>
            : <div className="steps-item">{content}</div>}
        </li>;
      })}
    </ol>
  </nav>;
}
