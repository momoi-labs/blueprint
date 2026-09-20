"use client"

import * as React from "react"
import { clsx as cn } from "clsx"

export type StepState = "pending" | "running" | "done" | "skipped" | "failed"

export type StepItem = {
  key: string
  label: string
  state: StepState
  /* Trailing mono text: a duration, a line count, "Not run". Running and
     skipped have a default; the others say nothing unless told. */
  meta?: string
  /* Rendered under the row. The narrow-viewport home for the step's output
     when a Split cannot sit beside the list. */
  detail?: React.ReactNode
}

const STATE_TEXT: Record<StepState, string> = {
  pending: "Pending", running: "Running", done: "Done", skipped: "Skipped", failed: "Failed",
}
const DEFAULT_META: Partial<Record<StepState, string>> = { running: "Running", skipped: "Not needed" }

export type StepListProps = Omit<React.ComponentProps<"ol">, "children" | "onSelect"> & {
  label: string
  steps: readonly StepItem[]
  /* When present every row is a button, and the product shows the selected
     step's output beside the list. */
  selected?: string | null
  onSelect?: (key: string) => void
}

/* The rail is the progress: each connector takes the state of the step below
   it, so the line fills as the run advances. Nothing else measures it. */
export function StepList({ label, steps, selected, onSelect, className, ...props }: StepListProps) {
  return <ol {...props} aria-label={label} data-slot="step-list" className={cn("step-list", className)}>
    {steps.map(step => {
      const row = <>
        <span className="step-label">{step.label}</span>
        <span className="step-meta">{step.meta ?? DEFAULT_META[step.state] ?? ""}</span>
      </>
      return <li key={step.key} data-slot="step" data-state={step.state} className="step"
        aria-current={step.state === "running" ? "step" : undefined}>
        <span className="step-rail" aria-hidden="true"><span className="step-mark" /></span>
        <div className="step-body">
          {onSelect
            ? <button type="button" className="step-row" aria-pressed={selected === step.key}
                aria-label={`${step.label}, ${STATE_TEXT[step.state].toLowerCase()}`}
                onClick={() => onSelect(step.key)}>{row}</button>
            : <div className="step-row" role="img" aria-label={`${step.label}, ${STATE_TEXT[step.state].toLowerCase()}`}>{row}</div>}
          {step.detail != null && <div className="step-detail">{step.detail}</div>}
        </div>
      </li>
    })}
  </ol>
}

export type StepBarProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: string
  steps: readonly { key: string; label: string; state: StepState; progress?: number | null }[]
}

/* One segment per step, coloured by state. The product writes the count and
   the current step beside it; the bar only names them for assistive tech. */
export function StepBar({ label, steps, className, ...props }: StepBarProps) {
  const failed = steps.findIndex(step => step.state === "failed")
  const running = steps.findIndex(step => step.state === "running")
  const at = failed >= 0 ? failed : running
  const finished = steps.length > 0 && steps.every(step => step.state === "done" || step.state === "skipped")
  const name = at >= 0
    ? `${label}: ${failed >= 0 ? "failed at" : "running"} step ${at + 1} of ${steps.length}, ${steps[at]!.label}`
    : finished ? `${label}: all ${steps.length} steps done` : `${label}: not started`
  return <div {...props} role="img" aria-label={name} data-slot="step-bar" className={cn("step-bar", className)}>
    {steps.map(step => {
      const progress = step.state === "running" && step.progress != null && Number.isFinite(step.progress)
        ? `${Math.min(1, Math.max(0, step.progress)) * 100}%` : undefined
      return <span key={step.key} data-state={step.state} title={step.label}
        style={progress !== undefined ? { "--step-progress": progress } as React.CSSProperties : undefined} />
    })}
  </div>
}
