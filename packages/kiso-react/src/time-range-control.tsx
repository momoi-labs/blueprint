"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { Button } from "./button.js"
import { Input } from "./input.js"
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js"

export type TimeRange = { from: number; to: number }
export type TimeRangeControlProps = {
  value: TimeRange
  bounds: TimeRange
  onValueChange: (range: TimeRange) => void
  label?: string
  disabled?: boolean
  className?: string
  presets?: readonly { label: string; duration: number }[]
}
const defaultPresets = [
  { label: "Last 5 minutes", duration: 300_000 },
  { label: "Last 15 minutes", duration: 900_000 },
  { label: "Last 30 minutes", duration: 1_800_000 },
]
const dateInput = (value: number) => new Date(value).toISOString().slice(0, 23)
const shortRange = (range: TimeRange) => {
  const from = dateInput(range.from)
  const to = dateInput(range.to)
  const sameDay = from.slice(0, 10) === to.slice(0, 10)
  const compact = (date: string) => (sameDay ? date.slice(11) : date.replace("T", " ")).replace(/:00\.000$/, "").replace(/\.000$/, "")
  return `${compact(from)} to ${compact(to)} UTC`
}
const validRange = (range: TimeRange) => Number.isFinite(range.from) && Number.isFinite(range.to)
  && Math.abs(range.from) <= 8.64e15 && Math.abs(range.to) <= 8.64e15 && range.from < range.to

export function TimeRangeControl({ value, bounds, onValueChange, label = "Time range", disabled,
  className, presets = defaultPresets }: TimeRangeControlProps) {
  const [open, setOpen] = React.useState(false)
  const [custom, setCustom] = React.useState(false)
  if (!validRange(bounds) || !validRange(value) || value.from < bounds.from || value.to > bounds.to) {
    throw new RangeError("Time range must be ordered and contained within the collection bounds.")
  }
  if (presets.some(preset => !Number.isFinite(preset.duration) || preset.duration <= 0)) {
    throw new RangeError("Time range preset durations must be positive milliseconds.")
  }
  const apply = (range: TimeRange) => { onValueChange(range); setOpen(false) }
  return <Popover open={open} onOpenChange={next => { setOpen(next); setCustom(false) }}>
    <PopoverTrigger asChild><Button disabled={disabled} className={cn("time-range-trigger", className)}
      aria-label={`${label}: ${dateInput(value.from).replace("T", " ")} to ${dateInput(value.to).replace("T", " ")} UTC`}>
      {shortRange(value)} <span aria-hidden="true">⌄</span>
    </Button></PopoverTrigger>
    <PopoverContent className="time-range-content" aria-label={label}>
      {custom ? <div className="stack-sm">
        <Button variant="ghost" onClick={() => setCustom(false)}>Back to presets</Button>
        <TimeRangeForm key={`${value.from}-${value.to}-${open}`} value={value} bounds={bounds} onApply={apply} />
      </div> : <div className="time-range-presets">
        <Button variant="ghost" onClick={() => apply(bounds)}><span>Entire run</span><small>{shortRange(bounds)}</small></Button>
        {presets.map(preset => {
          const range = { from: Math.max(bounds.from, bounds.to - preset.duration), to: bounds.to }
          return <Button variant="ghost" key={preset.label} onClick={() => apply(range)}><span>{preset.label}</span><small>{shortRange(range)}</small></Button>
        })}
        <Button variant="ghost" onClick={() => setCustom(true)}>Custom range</Button>
      </div>}
    </PopoverContent>
  </Popover>
}

function TimeRangeForm({ value, bounds, onApply }: { value: TimeRange; bounds: TimeRange; onApply: (range: TimeRange) => void }) {
  const id = React.useId()
  const [from, setFrom] = React.useState(dateInput(value.from))
  const [to, setTo] = React.useState(dateInput(value.to))
  const [error, setError] = React.useState("")
  return <form className="stack-sm" onSubmit={event => {
    event.preventDefault()
    const range = { from: Date.parse(`${from}Z`), to: Date.parse(`${to}Z`) }
    if (!validRange(range) || range.from < bounds.from || range.to > bounds.to) {
      setError("Choose a start before the end, within the collection window.")
      return
    }
    onApply(range)
  }}>
    <label htmlFor={`${id}-from`}>From (UTC)</label>
    <Input id={`${id}-from`} type="datetime-local" step="0.001" required value={from}
      min={dateInput(bounds.from)} max={dateInput(bounds.to)} onChange={event => { setFrom(event.target.value); setError("") }}
      aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
    <label htmlFor={`${id}-to`}>To (UTC)</label>
    <Input id={`${id}-to`} type="datetime-local" step="0.001" required value={to}
      min={dateInput(bounds.from)} max={dateInput(bounds.to)} onChange={event => { setTo(event.target.value); setError("") }}
      aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
    {error && <p id={`${id}-error`} role="alert" className="field-error">{error}</p>}
    <Button type="submit" variant="primary">Apply range</Button>
  </form>
}
