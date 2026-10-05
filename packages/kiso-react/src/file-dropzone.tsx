"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { clsx as cn } from "clsx";
import { ValidationMessage } from "./validation-message.js";

export type FileRejection = { file: File; reason: "type" | "multiple" };
export type FileDropzoneProps = Omit<ComponentProps<"input">, "type" | "children" | "value" | "defaultValue" | "onChange" | "size" | "required" | "name" | "form"> & {
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  error?: ReactNode;
  onFilesSelected: (files: File[]) => void;
  onFilesRejected?: (files: FileRejection[]) => void;
  invalidTypeMessage?: string;
  multipleFilesMessage?: string;
};

function accepts(file: File, accept?: string) {
  const rules = accept?.split(",").map(rule => rule.trim().toLowerCase()).filter(Boolean) ?? [];
  return rules.length === 0 || rules.some(rule => rule.startsWith(".")
    ? file.name.toLowerCase().endsWith(rule)
    : rule.endsWith("/*") ? file.type.toLowerCase().startsWith(rule.slice(0, -1))
    : file.type.toLowerCase() === rule);
}

export function FileDropzone({ label, description, icon, error, onFilesSelected, onFilesRejected,
  invalidTypeMessage = "Choose a file of an accepted type.", multipleFilesMessage = "Choose one file at a time.",
  id: providedId, className, disabled, accept, multiple = false, "aria-describedby": describedBy,
  "aria-labelledby": labelledBy, ...props }: FileDropzoneProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [rejection, setRejection] = useState<string>();
  const message = error || rejection;
  useEffect(() => { depth.current = 0; setDragging(false); }, [disabled]);

  function select(files: File[]) {
    if (disabled || files.length === 0) return;
    const rejected: FileRejection[] = !multiple && files.length > 1
      ? files.map(file => ({ file, reason: "multiple" }))
      : files.filter(file => !accepts(file, accept)).map(file => ({ file, reason: "type" }));
    if (rejected.length) {
      setRejection(rejected[0]!.reason === "multiple" ? multipleFilesMessage : invalidTypeMessage);
      onFilesRejected?.(rejected);
      return;
    }
    setRejection(undefined);
    onFilesSelected(files);
  }

  return <div className={cn("file-dropzone-field", className)} data-slot="file-dropzone">
    <label htmlFor={id} className="file-dropzone" data-dragging={dragging} data-disabled={disabled || undefined}
      data-invalid={!!message || props["aria-invalid"] === true || props["aria-invalid"] === "true"}
      onDragEnter={event => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); if (!disabled) { depth.current++; setDragging(true); } } }}
      onDragOver={event => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); event.dataTransfer.dropEffect = disabled ? "none" : "copy"; } }}
      onDragLeave={() => { depth.current = Math.max(0, depth.current - 1); if (depth.current === 0) setDragging(false); }}
      onDrop={event => { event.preventDefault(); depth.current = 0; setDragging(false); select(Array.from(event.dataTransfer.files)); }}>
      <input {...props} id={id} type="file" accept={accept} multiple={multiple} disabled={disabled}
        className="file-dropzone-input" aria-labelledby={labelledBy ?? `${id}-label`}
        aria-describedby={[describedBy, description != null ? `${id}-description` : null, message ? `${id}-error` : null].filter(Boolean).join(" ") || undefined}
        aria-invalid={message ? true : props["aria-invalid"]}
        onChange={event => { const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; select(files); }} />
      {icon != null && <span className="choice-icon" aria-hidden="true">{icon}</span>}
      <span className="choice-label" id={`${id}-label`}>{label}</span>
      {description != null && <span className="choice-description" id={`${id}-description`}>{description}</span>}
    </label>
    {message && <ValidationMessage id={`${id}-error`}>{message}</ValidationMessage>}
  </div>;
}
