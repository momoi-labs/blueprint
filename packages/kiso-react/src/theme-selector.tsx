"use client";

import { Button } from "./button.js";

export function ThemeSelector({
  theme,
  onChange,
}: {
  theme: string;
  onChange: (theme: string) => void;
}) {
  const options = [
    {
      value: "system",
      label: "Follow system",
      path: "M2 2h12v9H2zM8 11v3M5 14h6",
    },
    {
      value: "light",
      label: "Light theme",
      path: "M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 0v2m0 12v2M0 8h2m12 0h2M2 2l2 2m8 8 2 2M2 14l2-2M12 4l2-2",
    },
    {
      value: "dark",
      label: "Dark theme",
      path: "M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5Z",
    },
  ];
  return (
    <div className="theme-row">
      <span className="t-label">Theme</span>
      <div className="theme-buttons" role="group" aria-label="Theme">
        {options.map((option) => (
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            className="btn-icon"
            aria-label={option.label}
            title={option.label}
            aria-pressed={theme === option.value}
            onClick={() => onChange(option.value)}
          >
            <svg
              className="icon icon-sm"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <path d={option.path} />
            </svg>
          </Button>
        ))}
      </div>
    </div>
  );
}
