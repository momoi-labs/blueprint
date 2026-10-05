"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { RadioGroup as RadioPrimitive } from "radix-ui";
import { clsx as cn } from "clsx";
import { ValidationMessage } from "./validation-message.js";

export type RadioGroupProps = ComponentProps<typeof RadioPrimitive.Root> & {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  variant?: "default" | "tiles" | "segmented";
  controlSize?: "md" | "xl";
};

export function RadioGroup({ label, description, error, variant = "default", controlSize = "md",
  className, "aria-describedby": describedBy, "aria-labelledby": labelledBy, ...props }: RadioGroupProps) {
  const id = useId();
  const descriptionIds = [describedBy, description != null ? `${id}-description` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return <div className="field" data-slot="radio-group-field">
    <span id={`${id}-label`} className="t-label">{label}</span>
    {description != null && <span id={`${id}-description`} className="field-hint">{description}</span>}
    <RadioPrimitive.Root {...props} data-slot="radio-group" data-variant={variant} data-control-size={controlSize}
      aria-labelledby={labelledBy ?? `${id}-label`} aria-describedby={descriptionIds}
      aria-invalid={error ? true : props["aria-invalid"]} className={cn("radio-group", className)} />
    {error && <ValidationMessage id={`${id}-error`}>{error}</ValidationMessage>}
  </div>;
}

export type RadioGroupItemProps = Omit<ComponentProps<typeof RadioPrimitive.Item>, "children" | "asChild"> & {
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
};

export function RadioGroupItem({ label, description, icon, className,
  "aria-labelledby": labelledBy, "aria-describedby": describedBy, ...props }: RadioGroupItemProps) {
  const id = useId();
  return <RadioPrimitive.Item {...props} data-slot="radio-group-item" className={cn("radio-item", className)}
    aria-labelledby={labelledBy ?? `${id}-label`}
    aria-describedby={[describedBy, description != null ? `${id}-description` : null].filter(Boolean).join(" ") || undefined}>
    <span className="radio-indicator" aria-hidden="true"><RadioPrimitive.Indicator /></span>
    {icon != null && <span className="choice-icon" aria-hidden="true">{icon}</span>}
    <span className="choice-copy">
      <span className="choice-label" id={`${id}-label`}>{label}</span>
      {description != null && <span className="choice-description" id={`${id}-description`}>{description}</span>}
    </span>
  </RadioPrimitive.Item>;
}
