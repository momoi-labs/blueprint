import * as React from "react";
import { clsx as cn } from "clsx";

type LoudSeverity = "info" | "success" | "warning" | "error";

const loudMarks: Record<LoudSeverity, { shape: React.ReactNode; mark: React.ReactNode }> = {
  error: {
    shape: <circle cx="12" cy="12" r="10" />,
    mark: <><path d="M12 7.5v5" /><path d="M12 16.5h.01" /></>,
  },
  warning: {
    shape: <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />,
    mark: <><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  },
  info: {
    shape: <circle cx="12" cy="12" r="10" />,
    mark: <><path d="M12 16.5v-5" /><path d="M12 7.5h.01" /></>,
  },
  success: {
    shape: <circle cx="12" cy="12" r="10" />,
    mark: <path d="m8 12 3 3 5-5.5" />,
  },
};

function LoudMark({ variant, className }: { variant: LoudSeverity; className?: string }) {
  const id = `alert-mark-${React.useId().replace(/[^\w-]/g, "")}`;
  const { shape, mark } = loudMarks[variant];
  return (
    <svg className={cn("alert-mark", className)} viewBox="0 0 24 24" aria-hidden="true" data-slot="alert-mark">
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" />
        <g fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{mark}</g>
      </mask>
      <g mask={`url(#${id})`} fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">{shape}</g>
    </svg>
  );
}

export { LoudMark };
