"use client";

export const accents = [
  "violet",
  "terracotta",
  "teal",
  "cobalt",
  "nocturne",
] as const;

export type Accent = (typeof accents)[number];

const label = (accent: string) =>
  `${accent[0].toUpperCase()}${accent.slice(1)}`;

export function AccentSelector({
  accent,
  onChange,
  options = accents,
  preview = true,
}: {
  accent: string;
  onChange: (accent: Accent) => void;
  options?: readonly Accent[];
  /** Render the live preview of the selected accent below the pills. */
  preview?: boolean;
}) {
  return (
    <div className="accent-row">
      <div className="theme-row">
        <span className="t-label">Accent</span>
        <div className="accent-pills" role="group" aria-label="Accent">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className="accent-pill"
              aria-pressed={accent === option}
              data-accent={option}
              onClick={() => onChange(option)}
            >
              <span className="accent-dot" aria-hidden="true" />
              {label(option)}
            </button>
          ))}
        </div>
      </div>
      {preview && (
        <div className="accent-preview" data-accent={accent} aria-hidden="true">
          <span className="accent-preview-sidebar">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="accent-preview-main">
            <i className="accent-preview-title" />
            <i className="accent-preview-text" />
            <i className="accent-preview-link" />
            <span className="accent-preview-actions">
              <i className="accent-preview-primary" />
              <i className="accent-preview-secondary" />
            </span>
            <i className="accent-preview-selected" />
          </span>
        </div>
      )}
    </div>
  );
}
