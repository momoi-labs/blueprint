"use client";

import { useId, type ComponentProps } from "react";
import { Input } from "./input.js";
import { Label } from "./label.js";

export function FormField({
  label,
  hint,
  id: providedId,
  "aria-describedby": describedBy,
  ...props
}: ComponentProps<typeof Input> & { label: string; hint?: string }) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const description = [describedBy, hint ? `${id}-help` : undefined]
    .filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <Label htmlFor={id}>{label}</Label>
      <Input {...props} id={id} aria-describedby={description} />
      {hint && (
        <small className="field-hint" id={`${id}-help`}>{hint}</small>
      )}
    </div>
  );
}
