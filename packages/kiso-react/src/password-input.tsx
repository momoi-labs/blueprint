"use client";

import { useEffect, useId, useState, type ComponentProps } from "react";
import { Button } from "./button.js";
import { Input } from "./input.js";

const defaultLabels = {
  show: "Show", hide: "Hide",
  showName: "Show password", hideName: "Hide password",
  shown: "Your password is visible", hidden: "Your password is hidden",
};

export type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type"> & {
  labels?: Partial<typeof defaultLabels>;
};

export function PasswordInput({ labels, id: providedId, disabled, ...props }: PasswordInputProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const text = { ...defaultLabels, ...labels };
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState("");

  // Mask again on submit so the browser never saves the value as plain text.
  useEffect(() => {
    const form = (document.getElementById(id) as HTMLInputElement | null)?.form;
    if (!revealed || !form) return;
    const hide = () => { setRevealed(false); setStatus(text.hidden); };
    form.addEventListener("submit", hide);
    return () => form.removeEventListener("submit", hide);
  }, [id, revealed, text.hidden]);

  function toggle() {
    setRevealed(!revealed);
    setStatus(revealed ? text.hidden : text.shown);
  }

  return (
    <div className="field-control password-input" data-slot="password-input" data-revealed={revealed}>
      <Input autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false}
        {...props} id={id} disabled={disabled} type={revealed ? "text" : "password"} />
      <Button size="sm" variant="ghost" className="password-input-toggle" aria-controls={id}
        aria-label={revealed ? text.hideName : text.showName} disabled={disabled} onClick={toggle}>
        <span aria-hidden={revealed}>{text.show}</span>
        <span aria-hidden={!revealed}>{text.hide}</span>
      </Button>
      <span className="password-input-status" aria-live="polite">{status}</span>
    </div>
  );
}
