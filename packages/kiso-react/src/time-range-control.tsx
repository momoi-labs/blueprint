"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { Check, ChevronDown, Pause, Radio } from "lucide-react"
import { Button } from "./button.js"
import { Form, FormActions } from "./form.js"
import { Input } from "./input.js"
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js"
import { Search } from "./search.js"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip.js"
import { browserTimeZone, dateFormat, parseWallTime, timeZones, validInstant, validTimeZone, wallString,
  zoneName } from "./time-zone.js"

export type TimeRange = { from: number; to: number }
/** A live value: relative follows the wall clock, absolute is paused. */
export type LiveTimeRange = { kind: "relative"; duration: number } | { kind: "absolute"; from: number; to: number }
export type TimeRangePreset = { label: string; duration: number }
export type TimeRangeUnit = "second" | "minute" | "hour" | "day"
export type TimeRangeState = "live" | "paused"

const defaultLabels = {
  entireRun: "Entire run",
  custom: "Custom range",
  backToPresets: "Back to presets",
  backToLive: "Back to live",
  apply: "Apply range",
  from: (zone: string) => `From (${zone})`,
  to: (zone: string) => `To (${zone})`,
  error: "Choose a start before the end, within the collection window.",
  liveError: "Choose a start before the end, within the kept data.",
  presets: "Presets",
  live: "Live",
  paused: "Paused",
  relative: (count: number, unit: TimeRangeUnit) => `Last ${count} ${unit}${count === 1 ? "" : "s"}`,
  /** Visible range text: short times and the zone name. */
  range: (from: string, to: string, zone: string) => `${from} to ${to} ${zone}`,
  /** Full timestamps for the tooltip and the accessible name. */
  fullRange: (from: string, to: string) => `${from} to ${to}`,
  triggerName: ({ label, state, text, range }: { label: string; state: string; text: string; range: string }) =>
    `${label}, ${state}: ${text}, ${range}`,
  pausedAt: (range: string) => `Paused at ${range}.`,
  timeZone: "Time zone",
  timeZoneButton: (zone: string) => `Time zone: ${zone}`,
  browserTimeZone: (zone: string) => `Browser time zone (${zone})`,
  utc: "UTC",
  searchTimeZones: "Search time zones",
  noTimeZones: "No matching time zones.",
  unavailable: "Time unavailable",
}
export type TimeRangeControlLabels = typeof defaultLabels

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

const defaultPresets = [
  { label: "Last 5 minutes", duration: 300_000 },
  { label: "Last 15 minutes", duration: 900_000 },
  { label: "Last 30 minutes", duration: 1_800_000 },
]
// Browsers drop zero seconds and milliseconds from a datetime-local value.
const wallKey = (text: string) => {
  const [date, time = ""] = text.split("T")
  const [clock = "", fraction = ""] = time.split(".")
  return `${date}T${clock.length === 5 ? `${clock}:00` : clock}.${fraction.padEnd(3, "0")}`
}
const validRange = (range: TimeRange) => validInstant(range.from) && validInstant(range.to) && range.from < range.to

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

const units: [TimeRangeUnit, number][] = [["day", 86_400_000], ["hour", 3_600_000], ["minute", 60_000], ["second", 1000]]
const positive = (value: number) => Number.isFinite(value) && value > 0

function documentLocale() {
  return typeof document === "undefined" ? undefined : document.documentElement.lang || undefined
}

function validLocale(locale: string | undefined) {
  if (locale === undefined) return undefined
  try { return Intl.getCanonicalLocales(locale)[0] } catch { return undefined }
}

function LiveControl({ value, now, maxDuration, resumeDuration, onValueChange, label = "Time range", disabled,
  className, presets = defaultPresets, timeZone, onTimeZoneChange, locale, labels }: LiveTimeRangeControlProps) {
  const text = { ...defaultLabels, ...labels }
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<"presets" | "custom" | "zone">("presets")
  const [session, setSession] = React.useState(0)
  const [chosenZone, setChosenZone] = React.useState<string>()
  const zone = validTimeZone(timeZone) ? timeZone : validTimeZone(chosenZone) ? chosenZone : browserTimeZone()
  const language = validLocale(locale ?? documentLocale())
  const valid = presets.filter(preset => positive(preset.duration))
  const shown = valid.filter(preset => preset.duration <= maxDuration)
  const relative = value?.kind === "relative"
  const state: TimeRangeState = relative ? "live" : "paused"
  const resolved: TimeRange = relative ? { from: now - value.duration, to: now }
    : { from: value?.kind === "absolute" ? value.from : NaN, to: value?.kind === "absolute" ? value.to : NaN }
  const resolvable = validRange(resolved)

  const time = (instant: number, withDate: boolean) => dateFormat(language, { timeZone: zone, hour: "2-digit",
    minute: "2-digit", second: "2-digit", ...(withDate ? { month: "short", day: "numeric" } : {}) }).format(instant)
  const full = (instant: number) => dateFormat(language, { timeZone: zone, year: "numeric", month: "short",
    day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "longOffset" }).format(instant)
  const shortRange = (range: TimeRange) => {
    if (!validRange(range)) return text.unavailable
    const crosses = wallString(range.from, zone, "second").slice(0, 10) !== wallString(range.to, zone, "second").slice(0, 10)
    return text.range(time(range.from, crosses), time(range.to, crosses), zoneName(range.from, zone, language))
  }
  const relativeText = (duration: number) => {
    if (!positive(duration)) return text.unavailable
    const preset = valid.find(item => item.duration === duration)
    if (preset) return preset.label
    const [unit, size] = units.find(([, size]) => duration % size === 0) ?? ["second", 1000]
    return text.relative(Math.max(1, Math.round(duration / size)), unit)
  }
  const triggerText = relative ? relativeText(value.duration) : shortRange(resolved)
  const fullText = resolvable ? text.fullRange(full(resolved.from), full(resolved.to)) : text.unavailable
  const StateIcon = relative ? Radio : Pause

  const apply = (next: LiveTimeRange) => { onValueChange(next); setOpen(false) }
  const chooseZone = (next: string) => {
    setChosenZone(next)
    onTimeZoneChange?.(next)
    setView("presets")
  }
  const fieldZone = zoneName(validInstant(now) ? now : resolved.from, zone, language)

  return <Popover open={open} onOpenChange={next => {
    setOpen(next)
    setView("presets")
    if (next) setSession(count => count + 1)
  }}>
    <TooltipProvider><Tooltip>
      <TooltipTrigger asChild><PopoverTrigger asChild>
        <Button disabled={disabled} className={cn("time-range-trigger", className)} data-time-range-state={state}
          aria-label={text.triggerName({ label, state: relative ? text.live : text.paused, text: triggerText, range: fullText })}>
          <StateIcon className="icon icon-sm" aria-hidden="true" /> {triggerText} <ChevronDown className="icon icon-sm" aria-hidden="true" />
        </Button>
      </PopoverTrigger></TooltipTrigger>
      <TooltipContent>{fullText}</TooltipContent>
    </Tooltip></TooltipProvider>
    <PopoverContent className="time-range-content" aria-label={label}>
      {view === "custom" ? <div className="stack-sm">
        <Button variant="ghost" onClick={() => setView("presets")}>{text.backToPresets}</Button>
        <LiveForm key={session} initial={resolved} now={now} maxDuration={maxDuration} timeZone={zone}
          zone={fieldZone} text={text} onApply={range => apply({ kind: "absolute", ...range })} />
      </div> : view === "zone" ? <TimeZoneView zone={zone} text={text} onBack={() => setView("presets")} onChoose={chooseZone} />
      : <div className="stack-sm">
        {!relative && <div className="time-range-paused">
          <p>{text.pausedAt(shortRange(resolved))}</p>
          <Button onClick={() => apply({ kind: "relative", duration: resumeDuration })}>
            <Radio className="icon icon-sm" aria-hidden="true" /> {text.backToLive}
          </Button>
        </div>}
        <div className="time-range-presets" role="group" aria-label={text.presets}>
          {shown.map(preset => {
            const selected = relative && value.duration === preset.duration
            return <Button variant="ghost" key={`${preset.label}-${preset.duration}`} className="time-range-option"
              aria-pressed={selected} onClick={() => apply({ kind: "relative", duration: preset.duration })}>
              <span>{preset.label}</span>{selected && <Check className="icon icon-sm" aria-hidden="true" />}
            </Button>
          })}
          <Button variant="ghost" onClick={() => setView("custom")}>{text.custom}</Button>
        </div>
        <Button variant="ghost" className="time-range-zone" onClick={() => setView("zone")}>{text.timeZoneButton(zone)}</Button>
      </div>}
    </PopoverContent>
  </Popover>
}

const ceilSecond = (value: number) => Math.ceil(value / 1000) * 1000
const floorSecond = (value: number) => Math.floor(value / 1000) * 1000

function LiveForm({ initial, now, maxDuration, timeZone, zone, text, onApply }: { initial: TimeRange; now: number;
  maxDuration: number; timeZone: string; zone: string; text: TimeRangeControlLabels; onApply: (range: TimeRange) => void }) {
  const id = React.useId()
  const wall = (value: number) => validInstant(value) ? wallString(value, timeZone, "second") : ""
  // The draft is taken once per opening; polling changes now, never the draft.
  const [start] = React.useState(() => ({ from: wall(ceilSecond(initial.from)), to: wall(floorSecond(initial.to)), range: initial }))
  const [from, setFrom] = React.useState(start.from)
  const [to, setTo] = React.useState(start.to)
  const [error, setError] = React.useState("")
  const min = wall(ceilSecond(now - maxDuration))
  const max = wall(floorSecond(now))
  // Native constraints compare wall times, which a DST overlap can reverse, so
  // they are hints only and Apply validates instants.
  const hint = min && max && min < max ? { min, max } : {}
  const field = { type: "datetime-local", step: "1", required: true, ...hint,
    "aria-invalid": !!error, "aria-describedby": error ? `${id}-error` : undefined }
  return <Form className="stack-sm" noValidate onSubmit={event => {
    event.preventDefault()
    // A field that still reads its initial wall time keeps the value's
    // milliseconds.
    const read = (text: string, initial: string, original: number) =>
      wallKey(text) === wallKey(initial) ? original : parseWallTime(text, timeZone)
    const range = { from: read(from, start.from, start.range.from), to: read(to, start.to, start.range.to) }
    if (!validRange(range) || !(range.from >= now - maxDuration) || !(range.to <= now)) {
      setError(text.liveError)
      return
    }
    onApply(range)
  }}>
    <label htmlFor={`${id}-from`}>{text.from(zone)}</label>
    <Input id={`${id}-from`} {...field} value={from} onChange={event => { setFrom(event.target.value); setError("") }} />
    <label htmlFor={`${id}-to`}>{text.to(zone)}</label>
    <Input id={`${id}-to`} {...field} value={to} onChange={event => { setTo(event.target.value); setError("") }} />
    {error && <p id={`${id}-error`} role="alert" className="field-error">{error}</p>}
    <FormActions><Button type="submit" variant="primary">{text.apply}</Button></FormActions>
  </Form>
}

function TimeZoneView({ zone, text, onBack, onChoose }: { zone: string; text: TimeRangeControlLabels;
  onBack: () => void; onChoose: (zone: string) => void }) {
  const [query, setQuery] = React.useState("")
  const browser = browserTimeZone()
  const search = query.trim().toLowerCase()
  const matches = search ? timeZones().filter(item => item.toLowerCase().includes(search)).slice(0, 50) : []
  const option = (item: string, name: string) => <Button variant="ghost" key={item} className="time-range-option"
    aria-pressed={item === zone} onClick={() => onChoose(item)}>
    <span>{name}</span>{item === zone && <Check className="icon icon-sm" aria-hidden="true" />}
  </Button>
  return <div className="stack-sm">
    <Button variant="ghost" onClick={onBack}>{text.backToPresets}</Button>
    <div className="time-range-presets" role="group" aria-label={text.timeZone}>
      {option(browser, text.browserTimeZone(browser))}
      {browser !== "UTC" && option("UTC", text.utc)}
    </div>
    <Search aria-label={text.searchTimeZones} placeholder={text.searchTimeZones} value={query}
      onChange={event => setQuery(event.target.value)} />
    {search && (matches.length
      ? <div className="time-range-presets time-range-zones" role="group" aria-label={text.searchTimeZones}>
        {matches.map(item => option(item, item))}
      </div>
      : <p className="time-range-empty">{text.noTimeZones}</p>)}
  </div>
}
