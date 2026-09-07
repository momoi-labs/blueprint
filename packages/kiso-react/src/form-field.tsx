"use client";

import {
  cloneElement,
  useId,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { Input } from "./input.js";
import { Label } from "./label.js";
import { ValidationMessage } from "./validation-message.js";

type FormControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: ComponentProps<"input">["aria-invalid"];
};

type FormFieldProps = Omit<ComponentProps<typeof Input>, "children"> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children?: ReactElement<FormControlProps>;
  fieldClassName?: string;
};

function mergeDescriptions(...descriptions: (string | undefined)[]) {
  const ids = descriptions.flatMap((description) =>
    description?.split(/\s+/).filter(Boolean) ?? []
  );
  return ids.length > 0 ? [...new Set(ids)].join(" ") : undefined;
}

export function FormField({
  label,
  hint,
  error,
  children,
  fieldClassName,
  id: providedId,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...props
}: FormFieldProps) {
  const generatedId = useId();
  const id = providedId ?? children?.props.id ?? generatedId;
  const hintId = hint ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const description = mergeDescriptions(
    describedBy,
    children?.props["aria-describedby"],
    hintId,
    errorId,
  );
  const controlProps = {
    id,
    "aria-describedby": description,
    "aria-invalid": error ? true : children?.props["aria-invalid"] ?? invalid,
  };

  return (
    <div className={fieldClassName ? `field ${fieldClassName}` : "field"}>
      <Label htmlFor={id}>{label}</Label>
      {children
        ? cloneElement(children, controlProps)
        : <Input {...props} {...controlProps} />}
      {hint && (
        <small className="field-hint" id={hintId}>{hint}</small>
      )}
      {error && <ValidationMessage id={errorId}>{error}</ValidationMessage>}
    </div>
  );
}

export type { FormFieldProps };
