"use client";

import { useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { clsx as cn } from "clsx";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect.js";

/** Paints a value. Return HTML as `{ __html }`, as from Prism; nothing leaves the text plain. */
export type CodeEditorHighlight = (code: string) => ReactNode | { __html: string };

export type CodeEditorProps = Omit<ComponentProps<"textarea">, "children" | "value" | "defaultValue" | "wrap"> & {
  value?: string;
  defaultValue?: string;
  highlight?: CodeEditorHighlight;
  lineNumbers?: boolean;
};

function isHTML(painted: unknown): painted is { __html: string } {
  return typeof painted === "object" && painted !== null && "__html" in painted;
}

export function CodeEditor({ className, value, defaultValue = "", highlight, lineNumbers = true,
  rows = 5, disabled, onChange, onScroll, ref, ...props }: CodeEditorProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const code = value ?? uncontrolled;
  const input = useRef<HTMLTextAreaElement | null>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  // A disabled value is plain text in the disabled color, like any field.
  const painted = disabled ? undefined : highlight?.(code);
  const highlighted = painted != null && painted !== false && painted !== "";
  const lines = code.split("\n").length;

  // Layers move with the textarea instead of scrolling, so they never clamp
  // at a different extent than the textarea does.
  function sync() {
    const { scrollTop = 0, scrollLeft = 0 } = input.current ?? {};
    if (gutter.current) gutter.current.style.transform = `translateY(${-scrollTop}px)`;
    if (layer.current) layer.current.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`;
  }
  // A layer that mounts while the textarea is scrolled starts in step.
  useIsomorphicLayoutEffect(sync);

  return (
    <div className={cn("field-control code-editor", className)} data-slot="code-editor"
      data-highlighted={highlighted} data-line-numbers={lineNumbers}>
      {lineNumbers && <div className="code-editor-gutter" aria-hidden="true"
        style={{ "--code-editor-digits": String(lines).length } as CSSProperties}>
        <div ref={gutter}>{Array.from({ length: lines }, (_, index) => <span key={index}>{index + 1}</span>)}</div>
      </div>}
      <div className="code-editor-code">
        {highlighted && <div className="code-editor-highlight" aria-hidden="true">
          {isHTML(painted)
            ? <div ref={layer} dangerouslySetInnerHTML={painted} />
            : <div ref={layer}>{painted as ReactNode}</div>}
        </div>}
        <textarea autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false} {...props}
          ref={(node) => {
            input.current = node;
            if (typeof ref === "function") return ref(node);
            if (ref) ref.current = node;
          }}
          className="code-editor-input" rows={rows} wrap="off" disabled={disabled} value={code}
          onChange={(event) => { if (value === undefined) setUncontrolled(event.target.value); onChange?.(event); }}
          onScroll={(event) => { sync(); onScroll?.(event); }} />
      </div>
    </div>
  );
}
