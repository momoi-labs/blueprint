"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { ChevronDown } from "lucide-react"
import { Button } from "./button.js"
import { Form, FormActions } from "./form.js"
import { Input } from "./input.js"
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js"
import { parseWallTime, validTimeZone, wallString, zoneName } from "./time-zone.js"
import { LiveControl } from "./time-range-live.js"
import { defaultLabels, defaultPresets, validRange, type LiveTimeRange, type TimeRange, type TimeRangeControlLabels,
  type TimeRangePreset } from "./time-range-shared.js"

export type { LiveTimeRange, TimeRange, TimeRangeControlLabels, TimeRangePreset, TimeRangeState,
  TimeRangeUnit } from "./time-range-shared.js"

type SharedProps = {
  label?: string
  disabled?: boolean
  className?: string
  presets?: readonly TimeRangePreset[]
  /** IANA time zone. Live defaults to the browser's zone, artifact to UTC. */
  timeZone?: string
  onTimeZoneChange?: (timeZone: string) => void
  /** Locale for live date formats. Defaults to the document's language. */
  locale?: string
  labels?: Partial<TimeRangeControlLabels>
}
export type ArtifactTimeRangeControlProps = SharedProps & {
  mode?: "artifact"
  value: TimeRange
  bounds: TimeRange
  onValueChange: (range: TimeRange) => void
}
export type LiveTimeRangeControlProps = SharedProps & {
  mode: "live"
  value: LiveTimeRange
  /** Wall-clock epoch milliseconds of the consumer's last query. */
  now: number
  /** Retention: presets and custom ranges stop at this span. */
  maxDuration: number
  /** The relative duration "Back to live" applies. */
  resumeDuration: number
  onValueChange: (value: LiveTimeRange) => void
}
export type TimeRangeControlProps = ArtifactTimeRangeControlProps | LiveTimeRangeControlProps

// Browsers drop zero seconds and milliseconds from a datetime-local value.
const wallKey = (text: string) => {
  const [date, time = ""] = text.split("T")
  const [clock = "", fraction = ""] = time.split(".")
  return `${date}T${clock.length === 5 ? `${clock}:00` : clock}.${fraction.padEnd(3, "0")}`
}

export function TimeRangeControl(props: TimeRangeControlProps) {
  return props.mode === "live" ? <LiveControl {...props} /> : <ArtifactControl {...props} />
}

function ArtifactControl({ value, bounds, onValueChange, label = "Time range", disabled, className,
  presets = defaultPresets, timeZone = "UTC", labels }: ArtifactTimeRangeControlProps) {
  const text = { ...defaultLabels, ...labels }
  const [open, setOpen] = React.useState(false)
  const [custom, setCustom] = React.useState(false)
  if (!validRange(bounds) || !validRange(value) || value.from < bounds.from || value.to > bounds.to) {
    throw new RangeError("Time range must be ordered and contained within the collection bounds.")
  }
  if (presets.some(preset => !Number.isFinite(preset.duration) || preset.duration <= 0)) {
    throw new RangeError("Time range preset durations must be positive milliseconds.")
  }
  if (!validTimeZone(timeZone)) throw new RangeError("Time range time zone must be a valid IANA name.")
  const zone = zoneName(value.from, timeZone)
  const dateInput = (time: number) => wallString(time, timeZone, "millisecond")
  const shortRange = (range: TimeRange) => {
    const from = dateInput(range.from)
    const to = dateInput(range.to)
    const sameDay = from.slice(0, 10) === to.slice(0, 10)
    const compact = (date: string) => (sameDay ? date.slice(11) : date.replace("T", " ")).replace(/:00\.000$/, "").replace(/\.000$/, "")
    return text.range(compact(from), compact(to), zone)
  }
  const apply = (range: TimeRange) => { onValueChange(range); setOpen(false) }
  return <Popover open={open} onOpenChange={next => { setOpen(next); setCustom(false) }}>
    <PopoverTrigger asChild><Button disabled={disabled} className={cn("time-range-trigger", className)}
      aria-label={`${label}: ${text.range(dateInput(value.from).replace("T", " "), dateInput(value.to).replace("T", " "), zone)}`}>
      {shortRange(value)} <ChevronDown className="icon icon-sm" aria-hidden="true" />
    </Button></PopoverTrigger>
    <PopoverContent className="time-range-content" aria-label={label}>
      {custom ? <div className="stack-sm">
        <Button variant="ghost" onClick={() => setCustom(false)}>{text.backToPresets}</Button>
        <ArtifactForm key={`${value.from}-${value.to}-${open}`} value={value} bounds={bounds} timeZone={timeZone}
          zone={zone} text={text} onApply={apply} />
      </div> : <div className="time-range-presets">
        <Button variant="ghost" onClick={() => apply(bounds)}><span>{text.entireRun}</span><small>{shortRange(bounds)}</small></Button>
        {presets.map(preset => {
          const range = { from: Math.max(bounds.from, bounds.to - preset.duration), to: bounds.to }
          return <Button variant="ghost" key={preset.label} onClick={() => apply(range)}><span>{preset.label}</span><small>{shortRange(range)}</small></Button>
        })}
        <Button variant="ghost" onClick={() => setCustom(true)}>{text.custom}</Button>
      </div>}
    </PopoverContent>
  </Popover>
}

function ArtifactForm({ value, bounds, timeZone, zone, text, onApply }: { value: TimeRange; bounds: TimeRange;
  timeZone: string; zone: string; text: TimeRangeControlLabels; onApply: (range: TimeRange) => void }) {
  const id = React.useId()
  const dateInput = (time: number) => wallString(time, timeZone, "millisecond")
  const [from, setFrom] = React.useState(dateInput(value.from))
  const [to, setTo] = React.useState(dateInput(value.to))
  const [error, setError] = React.useState("")
  const utc = timeZone === "UTC"
  const min = dateInput(bounds.from)
  const max = dateInput(bounds.to)
  // Outside UTC, a DST overlap repeats wall times: an unchanged field keeps
  // its instant, and native constraints, which compare wall times, are hints.
  const [start] = React.useState({ from, to })
  const read = (text: string, initial: string, original: number) =>
    wallKey(text) === wallKey(initial) ? original : parseWallTime(text, timeZone)
  const hint = utc || min < max ? { min, max } : {}
  return <Form className="stack-sm" noValidate={!utc} onSubmit={event => {
    event.preventDefault()
    const range = utc ? { from: Date.parse(`${from}Z`), to: Date.parse(`${to}Z`) }
      : { from: read(from, start.from, value.from), to: read(to, start.to, value.to) }
    if (!validRange(range) || range.from < bounds.from || range.to > bounds.to) {
      setError(text.error)
      return
    }
    onApply(range)
  }}>
    <label htmlFor={`${id}-from`}>{text.from(zone)}</label>
    <Input id={`${id}-from`} type="datetime-local" step="0.001" required value={from}
      {...hint} onChange={event => { setFrom(event.target.value); setError("") }}
      aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
    <label htmlFor={`${id}-to`}>{text.to(zone)}</label>
    <Input id={`${id}-to`} type="datetime-local" step="0.001" required value={to}
      {...hint} onChange={event => { setTo(event.target.value); setError("") }}
      aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
    {error && <p id={`${id}-error`} role="alert" className="field-error">{error}</p>}
    <FormActions><Button type="submit" variant="primary">{text.apply}</Button></FormActions>
  </Form>
}
