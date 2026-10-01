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
  controlSize?: ComponentProps<typeof Input>["controlSize"];
  "data-control-size"?: ComponentProps<typeof Input>["controlSize"];
  "aria-describedby"?: string;
  "aria-invalid"?: ComponentProps<"input">["aria-invalid"];
};

type FormFieldProps = Omit<ComponentProps<typeof Input>, "children"> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children?: ReactElement<FormControlProps>;
  fieldClassName?: string;
  layout?: "stacked" | "inline";
  leading?: ReactNode;
  suffix?: ReactNode;
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
  layout = "stacked",
  leading,
  suffix,
  controlSize,
  id: providedId,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...props
}: FormFieldProps) {
  const generatedId = useId();
  const id = providedId ?? children?.props.id ?? generatedId;
  const hintId = hint ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const suffixId = suffix ? `${id}-suffix` : undefined;
  const size = controlSize ?? children?.props.controlSize ?? children?.props["data-control-size"];
  const description = mergeDescriptions(
    describedBy,
    children?.props["aria-describedby"],
    hintId,
    errorId,
    suffixId,
  );
  const controlProps = {
    id,
    "aria-describedby": description,
    "aria-invalid": error ? true : children?.props["aria-invalid"] ?? invalid,
    ...(size ? { "data-control-size": size } : {}),
  };
  const control = children
    ? cloneElement(children, controlProps)
    : <Input {...props} {...controlProps} />;
  const fieldLabel = <Label htmlFor={id}>{label}</Label>;
  const grouped = layout === "inline" || leading || suffix;

  return (
    <div className={fieldClassName ? `field ${fieldClassName}` : "field"} data-layout={layout} data-control-size={size}>
      {layout !== "inline" && fieldLabel}
      {grouped ? <div className="field-control">
        {leading && <span className="field-leading" aria-hidden="true">{leading}</span>}
        {layout === "inline" && fieldLabel}
        {control}
        {suffix && <span className="field-suffix" id={suffixId}>{suffix}</span>}
      </div> : control}
      {hint && (
        <small className="field-hint" id={hintId}>{hint}</small>
      )}
      {error && <ValidationMessage id={errorId}>{error}</ValidationMessage>}
    </div>
  );
}

export type { FormFieldProps };
