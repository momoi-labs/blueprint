"use client";

import { useId, useRef } from "react";
import { Button } from "./button.js";

function ThemePreview({ theme }: { theme: "system" | "light" | "dark" }) {
  const schemes = theme === "system" ? ["light", "dark"] : [theme];
  return <span className="theme-card-preview" aria-hidden="true">
    {schemes.map(scheme => <span className="theme-card-scene" data-theme={scheme} key={scheme}>
      <span className="theme-card-sidebar"><i /><i /><i /></span>
      <span className="theme-card-main">
        <span className="theme-card-header" />
        <span className="theme-card-content"><i /><i /><i /></span>
      </span>
    </span>)}
  </span>;
}

export function ThemeSelector({
  theme,
  onChange,
  variant = "compact",
}: {
  theme: string;
  onChange: (theme: string) => void;
  variant?: "compact" | "cards";
}) {
  const id = useId();
  const cards = variant === "cards";
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const options = [
    {
      value: "system",
      label: "Follow system",
      name: "System",
      description: "Follow your device",
      path: "M2 2h12v9H2zM8 11v3M5 14h6",
    },
    {
      value: "light",
      label: "Light theme",
      name: "Light",
      description: "Always use light colors",
      path: "M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 0v2m0 12v2M0 8h2m12 0h2M2 2l2 2m8 8 2 2M2 14l2-2M12 4l2-2",
    },
    {
      value: "dark",
      label: "Dark theme",
      name: "Dark",
      description: "Always use dark colors",
      path: "M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5Z",
    },
  ] as const;
  return (
    <div data-slot="theme-selector" data-variant={variant} className={cards ? "theme-selector-cards" : "theme-row"}>
      <span className="t-label">Theme</span>
      <div className={cards ? "theme-cards" : "theme-buttons"} role="radiogroup" aria-label="Theme">
        {options.map((option, index) => {
          const icon = <svg
            className="icon icon-sm"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          ><path d={option.path} /></svg>;
          return (
            <Button
              key={option.value}
              ref={(button) => { buttons.current[index] = button; }}
              variant="ghost"
              size="sm"
              className={cards ? "theme-card" : "btn-icon"}
              role="radio"
              aria-label={option.label}
              aria-describedby={cards ? `${id}-${option.value}-description` : undefined}
              title={option.label}
              aria-checked={theme === option.value}
              tabIndex={theme === option.value ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => {
                if (event.altKey || event.ctrlKey || event.metaKey) return;
                const direction = event.key === "ArrowRight" || event.key === "ArrowDown"
                  ? 1
                  : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
                if (!direction) return;
                event.preventDefault();
                const next = (index + direction + options.length) % options.length;
                buttons.current[next]?.focus();
                onChange(options[next].value);
              }}
            >
              {cards ? <>
                <ThemePreview theme={option.value} />
                <span className="theme-card-label">{icon}{option.name}</span>
                <span id={`${id}-${option.value}-description`} className="theme-card-description">{option.description}</span>
              </> : icon}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
