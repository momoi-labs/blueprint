"use client";

import { useId, useRef } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
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
      Icon: Monitor,
    },
    {
      value: "light",
      label: "Light theme",
      name: "Light",
      description: "Always use light colors",
      Icon: Sun,
    },
    {
      value: "dark",
      label: "Dark theme",
      name: "Dark",
      description: "Always use dark colors",
      Icon: Moon,
    },
  ] as const;
  return (
    <div data-slot="theme-selector" data-variant={variant} className={cards ? "theme-selector-cards" : "theme-row"}>
      <span className="t-label">Theme</span>
      <div className={cards ? "theme-cards" : "theme-buttons"} role="radiogroup" aria-label="Theme">
        {options.map((option, index) => {
          const icon = <option.Icon className="icon icon-sm" aria-hidden="true" />;
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
