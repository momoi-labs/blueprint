"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { Check, ChevronDown, Globe, Pause, Play, Radio } from "lucide-react"
import { Button } from "./button.js"
import { FormField } from "./form-field.js"
import { Input } from "./input.js"
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js"
import { Search } from "./search.js"
import { Separator } from "./separator.js"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip.js"
import { browserTimeZone, dateFormat, timeZones, validInstant, validTimeZone, wallString, zoneName } from "./time-zone.js"
import { absoluteRangeText, parseRangeText, relativeRangeText, resolveRangeText, type RangeText } from "./time-range-text.js"
import { ceilSecond, defaultLabels, defaultPresets, documentLocale, durationText, floorSecond, positive, validLocale,
  validRange, type LiveTimeRange, type TimeRange, type TimeRangeControlLabels, type TimeRangePreset,
  type TimeRangeState } from "./time-range-shared.js"

export type LiveControlProps = {
  value: LiveTimeRange
  now: number
  maxDuration: number
  resumeDuration: number
  onValueChange: (value: LiveTimeRange) => void
  label?: string
  disabled?: boolean
  className?: string
  presets?: readonly TimeRangePreset[]
  timeZone?: string
  onTimeZoneChange?: (timeZone: string) => void
  locale?: string
  labels?: Partial<TimeRangeControlLabels>
}

/** Formatting shared by the trigger, tooltip, timeline, and fields. */
type Formats = {
  zone: string
  language: string | undefined
  text: TimeRangeControlLabels
  time: (instant: number, withDate: boolean) => string
  full: (instant: number) => string
  hint: (instant: number) => string
  axis: (instant: number, withDate: boolean) => string
  sameDay: (a: number, b: number) => boolean
}

type EscapeHandlers = { drag?: () => boolean; fields?: () => boolean }

export function LiveControl({ value, now, maxDuration, resumeDuration, onValueChange, label = "Time range", disabled,
  className, presets = defaultPresets, timeZone, onTimeZoneChange, locale, labels }: LiveControlProps) {
  const text = { ...defaultLabels, ...labels }
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<"main" | "zone">("main")
  const [chosenZone, setChosenZone] = React.useState<string>()
  const escape = React.useRef<EscapeHandlers>({})
  // Pause, resume, and a drag discard an edit in the fields by remounting them.
  const [fieldsKey, setFieldsKey] = React.useState(0)
  const zone = validTimeZone(timeZone) ? timeZone : validTimeZone(chosenZone) ? chosenZone : browserTimeZone()
  const language = validLocale(locale ?? documentLocale())
  const valid = presets.filter(preset => positive(preset.duration))
  const shown = valid.filter(preset => preset.duration <= maxDuration)
  const relative = value?.kind === "relative"
  const state: TimeRangeState = relative ? "live" : "paused"
  const resolved: TimeRange = relative ? { from: now - value.duration, to: now }
    : { from: value?.kind === "absolute" ? value.from : NaN, to: value?.kind === "absolute" ? value.to : NaN }
  const resolvable = validRange(resolved)

  const sameDay = (a: number, b: number) => wallString(a, zone, "second").slice(0, 10) === wallString(b, zone, "second").slice(0, 10)
  const formats: Formats = {
    zone, language, text, sameDay,
    time: (instant, withDate) => dateFormat(language, { timeZone: zone, hour: "2-digit", minute: "2-digit",
      second: "2-digit", ...(withDate ? { month: "short", day: "numeric" } : {}) }).format(instant),
    full: instant => dateFormat(language, { timeZone: zone, year: "numeric", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "longOffset" }).format(instant),
    hint: instant => dateFormat(language, { timeZone: zone, month: "short", day: "numeric", hour: "numeric",
      minute: "2-digit", second: "2-digit", timeZoneName: "short" }).format(instant),
    axis: (instant, withDate) => dateFormat(language, { timeZone: zone, hour: "numeric", minute: "2-digit",
      ...(withDate ? { month: "short", day: "numeric" } : {}) }).format(instant),
  }
  const shortRange = (range: TimeRange) => {
    if (!validRange(range)) return text.unavailable
    const crosses = !sameDay(range.from, range.to)
    return text.range(formats.time(range.from, crosses), formats.time(range.to, crosses), zoneName(range.from, zone, language))
  }
  const relativeText = (duration: number) => {
    if (!positive(duration)) return text.unavailable
    return valid.find(item => item.duration === duration)?.label ?? durationText(duration, text.relative)
  }
  const triggerText = relative ? relativeText(value.duration) : shortRange(resolved)
  const fullText = resolvable ? text.fullRange(formats.full(resolved.from), formats.full(resolved.to)) : text.unavailable
  const StateIcon = relative ? Radio : Pause

  const act = (next: LiveTimeRange) => { setFieldsKey(key => key + 1); onValueChange(next) }
  const pause = () => { if (resolvable) act({ kind: "absolute", ...resolved }) }
  const resume = () => act({ kind: "relative", duration: resumeDuration })
  const toggle = relative ? pause : resume
  const chooseZone = (next: string) => {
    setChosenZone(next)
    onTimeZoneChange?.(next)
    setView("main")
  }

  return <TooltipProvider><div className={cn("time-range-live", className)} role="group" aria-label={label}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button className="btn-icon time-range-live-pause" disabled={disabled || (relative && !resolvable)}
          aria-label={relative ? text.pause : text.resume} onClick={toggle}>
          {relative ? <Pause className="icon icon-sm" aria-hidden="true" /> : <Play className="icon icon-sm" aria-hidden="true" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{relative ? text.pause : text.resume}</TooltipContent>
    </Tooltip>
    <Popover open={open} onOpenChange={next => { setOpen(next); setView("main") }}>
      <Tooltip>
        <TooltipTrigger asChild><PopoverTrigger asChild>
          <Button disabled={disabled} className="time-range-trigger" data-time-range-state={state}
            aria-label={text.triggerName({ label, state: relative ? text.live : text.paused, text: triggerText, range: fullText })}>
            <StateIcon className="icon icon-sm" aria-hidden="true" /> {triggerText} <ChevronDown className="icon icon-sm" aria-hidden="true" />
          </Button>
        </PopoverTrigger></TooltipTrigger>
        <TooltipContent className="time-range-live-tip">
          {resolvable ? <>
            <Timeline range={resolved} now={now} maxDuration={maxDuration} live={relative} formats={formats} />
            <div className="time-range-live-ends">
              <span>{formats.time(resolved.from, !sameDay(resolved.from, resolved.to))}</span>
              <span>{formats.time(resolved.to, !sameDay(resolved.from, resolved.to))}</span>
            </div>
            <small>{retentionNote(resolved, maxDuration, formats)}</small>
          </> : text.unavailable}
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="time-range-live-content" aria-label={label} onEscapeKeyDown={event => {
        if (escape.current.drag?.() || escape.current.fields?.()) event.preventDefault()
      }}>
        {view === "zone" ? <TimeZoneView zone={zone} text={text} onBack={() => setView("main")} onChoose={chooseZone} />
        : <div className="time-range-live-panel">
          <div className="time-range-live-main">
            <div className="time-range-live-state">
              <span className="time-range-live-status"><StateIcon className="icon icon-sm" aria-hidden="true" /> {relative ? text.live : text.paused}</span>
              <Button size="sm" disabled={relative && !resolvable} onClick={toggle}>
                {relative ? <Pause className="icon icon-sm" aria-hidden="true" /> : <Play className="icon icon-sm" aria-hidden="true" />}
                {relative ? text.pause : text.backToLive}
              </Button>
            </div>
            <Timeline range={resolvable ? resolved : null} now={now} maxDuration={maxDuration} live={relative} formats={formats} />
            <Separator />
            <LiveFields key={fieldsKey} value={value} now={now} maxDuration={maxDuration} formats={formats} escape={escape}
              onApply={onValueChange} />
            <Separator />
            <Button variant="ghost" className="time-range-zone" onClick={() => setView("zone")}>
              <Globe className="icon icon-sm" aria-hidden="true" /> {text.timeZoneButton(zone)}
            </Button>
          </div>
          <div className="time-range-presets time-range-live-presets" role="group" aria-label={text.presets}>
            {shown.map(preset => {
              const selected = relative && value.duration === preset.duration
              return <Button variant="ghost" key={`${preset.label}-${preset.duration}`} className="time-range-option"
                aria-pressed={selected} onClick={() => { onValueChange({ kind: "relative", duration: preset.duration }); setOpen(false) }}>
                <span>{preset.label}</span>{selected && <Check className="icon icon-sm" aria-hidden="true" />}
              </Button>
            })}
          </div>
        </div>}
      </PopoverContent>
    </Popover>
  </div></TooltipProvider>
}

function retentionNote(range: TimeRange, maxDuration: number, { text, zone, language, sameDay }: Formats) {
  const date = dateFormat(language, { timeZone: zone, year: "numeric", month: "short", day: "numeric" })
  const keeps = positive(maxDuration) ? ` ${text.keeps(durationText(maxDuration, text.duration))}` : ""
  return `${sameDay(range.from, range.to) ? `${date.format(range.to)}, ` : ""}${zoneName(range.to, zone, language)}.${keeps}`
}

/** The retention window, [now - maxDuration, now], with the range on it. */
function Timeline({ range, now, maxDuration, live, formats }: { range: TimeRange | null; now: number;
  maxDuration: number; live: boolean; formats: Formats }) {
  const start = now - maxDuration
  const usable = validInstant(now) && positive(maxDuration) && validInstant(start)
  const older = usable && range && range.to < start
  const left = usable && range ? Math.min(1, Math.max(0, (range.from - start) / maxDuration)) : 0
  const right = usable && range ? Math.min(1, Math.max(0, (range.to - start) / maxDuration)) : 0
  return <div className="time-range-live-timeline">
    {older ? <p className="time-range-live-note">{formats.text.olderThanRetention}</p>
    : <div className="time-range-live-track" data-state={live ? "live" : "paused"} aria-hidden="true">
      {usable && range && <span className="time-range-live-segment"
        style={{ left: `${left * 100}%`, width: `${Math.max(right - left, 0.015) * 100}%` }} />}
    </div>}
    {usable && <div className="time-range-live-axis" aria-hidden="true">
      <span>{formats.axis(start, maxDuration >= 86_400_000)}</span><span>{formats.text.now}</span>
    </div>}
  </div>
}

type Draft = { from: string; to: string; zone: string }
type FieldError = { field: "from" | "to"; message: string }

function LiveFields({ value, now, maxDuration, formats, escape, onApply }: { value: LiveTimeRange; now: number;
  maxDuration: number; formats: Formats; escape: React.RefObject<EscapeHandlers>; onApply: (value: LiveTimeRange) => void }) {
  const { zone, text } = formats
  const form = React.useRef<HTMLFormElement>(null)
  const [draft, setDraft] = React.useState<Draft | null>(null)
  const [error, setError] = React.useState<FieldError | null>(null)
  const shown = value?.kind === "relative"
    ? (positive(value.duration) ? [relativeRangeText(value.duration), "now"] : ["", ""])
    : value?.kind === "absolute" ? [absoluteRangeText(ceilSecond(value.from), zone), absoluteRangeText(floorSecond(value.to), zone)]
    : ["", ""]
  // An edit belongs to the zone it was typed in.
  const edit = draft && draft.zone === zone ? draft : null
  const from = edit ? edit.from : shown[0]
  const to = edit ? edit.to : shown[1]
  const dirty = !!edit && (edit.from !== shown[0] || edit.to !== shown[1])
  const reset = () => { setDraft(null); setError(null) }
  escape.current.fields = () => {
    if (!dirty || !form.current?.contains(document.activeElement)) return false
    reset()
    return true
  }
  const change = (field: "from" | "to", next: string) => {
    setDraft({ from, to, zone, [field]: next })
    setError(null)
  }
  // Text that still shows an absolute value's end keeps its exact instant.
  const read = (field: "from" | "to", input: string): RangeText | null => {
    if (value?.kind === "absolute" && input === shown[field === "from" ? 0 : 1]) return { kind: "absolute", at: value[field] }
    return parseRangeText(input, zone, now)
  }
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const start = read("from", from)
    const end = read("to", to)
    if (!start) return setError({ field: "from", message: text.invalidStart })
    if (!end) return setError({ field: "to", message: text.invalidEnd })
    if (start.kind === "relative" && end.kind === "relative" && end.offset === 0) {
      if (start.offset <= 0) return setError({ field: "from", message: text.order })
      if (start.offset > maxDuration) return setError({ field: "from", message: text.retention })
      reset()
      return onApply({ kind: "relative", duration: start.offset })
    }
    const range = { from: resolveRangeText(start, now), to: resolveRangeText(end, now) }
    if (!(range.from < range.to)) return setError({ field: "from", message: text.order })
    if (!(range.from >= now - maxDuration)) return setError({ field: "from", message: text.retention })
    if (!(range.to <= now)) return setError({ field: "to", message: text.future })
    reset()
    onApply({ kind: "absolute", ...range })
  }
  const hint = (input: string) => {
    const parsed = parseRangeText(input, zone, now)
    if (!parsed) return text.fieldHint
    const at = resolveRangeText(parsed, now)
    return validInstant(at) ? text.resolvedHint(formats.hint(at), parsed.kind === "relative") : text.fieldHint
  }
  const fieldZone = zoneName(validInstant(now) ? now : Date.now(), zone, formats.language)
  return <form ref={form} className="time-range-live-fields" noValidate onSubmit={submit}>
    {(["from", "to"] as const).map(field => {
      const input = field === "from" ? from : to
      return <FormField key={field} label={text[field](fieldZone)} hint={hint(input)}
        error={error?.field === field ? <span role="alert">{error.message}</span> : undefined}>
        <Input value={input} autoComplete="off" spellCheck={false} onChange={event => change(field, event.target.value)} />
      </FormField>
    })}
    {dirty && <div className="time-range-live-actions">
      <Button type="button" variant="ghost" size="sm" onClick={reset}>{text.reset}</Button>
      <Button type="submit" variant="primary" size="sm">{text.apply}</Button>
    </div>}
  </form>
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
