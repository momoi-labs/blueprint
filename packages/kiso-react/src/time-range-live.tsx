"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { Check, ChevronDown, Globe, Pause, Play, Radio } from "lucide-react"
import { Button } from "./button.js"
import { Label } from "./label.js"
import { RangeCalendar } from "./time-range-calendar.js"
import { ValidationMessage } from "./validation-message.js"
import { Input } from "./input.js"
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js"
import { Search } from "./search.js"
import { Separator } from "./separator.js"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip.js"
import { browserTimeZone, dateFormat, timeZones, validInstant, validTimeZone, wallString, zoneName } from "./time-zone.js"
import { absoluteRangeText, parseRangeText, relativeRangeText, resolveRangeText, type RangeText } from "./time-range-text.js"
import { ceilSecond, defaultLabels, defaultPresets, documentLocale, durationText, floorSecond, minimumSpan, positive,
  snapDuration, validLocale,
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
  // The fields' edit lives here so the time zone view does not discard it.
  // Pause, resume, a drag, a zone change, and closing the popover do.
  const [fields, setFields] = React.useState<FieldsState>(cleanFields)
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

  if (fields.draft && fields.draft.zone !== zone) setFields(cleanFields)
  const act = (next: LiveTimeRange) => { setFields(cleanFields); onValueChange(next) }
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
    <Popover open={open} onOpenChange={next => { setOpen(next); setView("main"); setFields(cleanFields) }}>
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
            <RangeTimeline range={resolvable ? resolved : null} now={now} maxDuration={maxDuration} live={relative}
              formats={formats} escape={escape} onCommit={act} />
            <Separator />
            <LiveFields state={fields} setState={setFields} value={value} now={now} maxDuration={maxDuration} formats={formats} escape={escape}
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

type DragMode = "move" | "from" | "to"
type Drag = { mode: DragMode; pointer: number; x: number; width: number; now: number; from: number; to: number;
  preview: TimeRange; snap: boolean }

/** Moves or resizes `range` by `delta` inside [start, end], keeping the minimum span. */
function shift(mode: DragMode, range: TimeRange, delta: number, start: number, end: number, span: number): TimeRange {
  if (mode === "move") {
    const clamped = Math.max(start - range.from, Math.min(end - range.to, delta))
    return { from: range.from + clamped, to: range.to + clamped }
  }
  if (mode === "from") return { from: Math.max(start, Math.min(range.to - span, range.from + delta)), to: range.to }
  return { from: range.from, to: Math.min(end, Math.max(range.from + span, range.to + delta)) }
}

/** The popover's timeline: drag the range or its ends, or use the three sliders. */
function RangeTimeline({ range: value, now, maxDuration, live, formats, escape, onCommit }: { range: TimeRange | null;
  now: number; maxDuration: number; live: boolean; formats: Formats; escape: React.RefObject<EscapeHandlers>;
  onCommit: (value: LiveTimeRange) => void }) {
  const track = React.useRef<HTMLDivElement>(null)
  const dragRef = React.useRef<Drag | null>(null)
  const [drag, setDrag] = React.useState<Drag | null>(null)
  const start = now - maxDuration
  const usable = validInstant(now) && positive(maxDuration) && validInstant(start)
  if (!usable || !value || value.to < start) {
    return <Timeline range={value} now={now} maxDuration={maxDuration} live={live} formats={formats} />
  }
  const span = minimumSpan(maxDuration)
  // The sliders and drags work on the part of the range inside retention.
  const from = Math.min(now - span, Math.max(start, value.from))
  const range = { from, to: Math.min(now, Math.max(from + span, value.to)) }
  // Pointer precision follows a short retention; keyboard steps stay whole seconds.
  const unit = maxDuration >= 2000 ? 1000 : 1
  const step = Math.max(1000, Math.round(maxDuration / 120_000) * 1000)
  const { text } = formats
  const update = (next: Drag | null) => { dragRef.current = next; setDrag(next) }
  const cancel = () => {
    if (!dragRef.current) return false
    track.current?.releasePointerCapture?.(dragRef.current.pointer)
    update(null)
    return true
  }
  escape.current.drag = cancel
  // During a drag the window stays at the `now` the drag started with.
  const shown = drag ? drag.preview : range
  const windowNow = drag ? drag.now : now
  const windowStart = windowNow - maxDuration
  const left = Math.min(1, Math.max(0, (shown.from - windowStart) / maxDuration))
  const right = Math.min(1, Math.max(0, (shown.to - windowStart) / maxDuration))
  // The handles sit outside the move target, which is at least --time-range-hit wide.
  const width = Math.max(right - left, 0.015)
  const middle = left + width / 2
  const crosses = !formats.sameDay(shown.from, shown.to)
  const time = (instant: number) => formats.time(instant, crosses)

  const begin = (mode: DragMode) => (event: React.PointerEvent) => {
    if (event.button !== 0 || !track.current) return
    event.preventDefault()
    event.stopPropagation()
    track.current.setPointerCapture?.(event.pointerId)
    const width = track.current.getBoundingClientRect().width
    update({ mode, pointer: event.pointerId, x: event.clientX, width, now, from: range.from, to: range.to,
      preview: range, snap: false })
  }
  const move = (event: React.PointerEvent) => {
    const current = dragRef.current
    if (!current || event.pointerId !== current.pointer || !current.width) return
    const delta = Math.round((event.clientX - current.x) / current.width * maxDuration / unit) * unit
    let preview = shift(current.mode, current, delta, current.now - maxDuration, current.now, span)
    const snap = preview.to >= current.now - maxDuration * 0.015
    if (snap) preview = { from: preview.from, to: current.now }
    update({ ...current, preview, snap })
  }
  const end = (event: React.PointerEvent) => {
    const current = dragRef.current
    if (!current || event.pointerId !== current.pointer) return
    update(null)
    track.current?.releasePointerCapture?.(current.pointer)
    if (current.preview.from === current.from && current.preview.to === current.to) return
    if (current.snap) return onCommit({ kind: "relative", duration: snapDuration(current.preview.to - current.preview.from, maxDuration) })
    // Checked against the retention of the current `now`.
    const from = Math.max(current.preview.from, now - maxDuration)
    const to = Math.min(current.preview.to, now)
    if (to - from >= span) onCommit({ kind: "absolute", from, to })
  }
  const key = (mode: DragMode) => (event: React.KeyboardEvent) => {
    const limits = mode === "move" ? [start, now - (range.to - range.from)] : mode === "from" ? [start, range.to - span] : [range.from + span, now]
    const current = mode === "to" ? range.to : range.from
    const big = step * 10
    const deltas: Record<string, number> = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step,
      PageDown: -big, PageUp: big, Home: limits[0] - current, End: limits[1] - current }
    if (!(event.key in deltas)) return
    event.preventDefault()
    const delta = event.shiftKey && event.key.startsWith("Arrow") ? deltas[event.key] * 10 : deltas[event.key]
    const next = shift(mode, range, delta, start, now, span)
    if (next.from !== range.from || next.to !== range.to) onCommit({ kind: "absolute", ...next })
  }
  const slider = (mode: DragMode, name: string, min: number, max: number, value: number, valueText: string) => ({
    role: "slider", tabIndex: 0, "aria-label": name, "aria-valuemin": min, "aria-valuemax": max, "aria-valuenow": value,
    "aria-valuetext": valueText, "aria-orientation": "horizontal" as const, onKeyDown: key(mode), onPointerDown: begin(mode),
  })
  return <div className="time-range-live-timeline">
    <div ref={track} className="time-range-live-track" data-state={live && (!drag || drag.snap) ? "live" : "paused"}
      data-dragging={drag ? drag.mode : undefined} onPointerMove={move} onPointerUp={end}
      onPointerCancel={cancel} onLostPointerCapture={() => { if (dragRef.current) update(null) }}>
      <span className="time-range-live-handle" data-edge="start"
        style={{ left: `min(${left * 100}%, calc(${middle * 100}% - var(--time-range-hit) / 2))` }}
        {...slider("from", text.rangeStart, start, range.to - span, range.from, time(range.from))} />
      <span className="time-range-live-segment" style={{ left: `${left * 100}%`, width: `${width * 100}%` }}
        {...slider("move", text.moveRange, start, now - (range.to - range.from), range.from,
          text.fullRange(time(range.from), time(range.to)))} />
      <span className="time-range-live-handle" data-edge="end"
        style={{ left: `max(${(left + width) * 100}%, calc(${middle * 100}% + var(--time-range-hit) / 2))` }}
        {...slider("to", text.rangeEnd, range.from + span, now, range.to, time(range.to))} />
    </div>
    <div className="time-range-live-axis" aria-hidden="true">
      <span>{formats.axis(windowStart, maxDuration >= 86_400_000)}</span><span>{text.now}</span>
    </div>
    {drag?.snap && <p className="time-range-live-note" role="status">
      {text.releaseToLive(durationText(snapDuration(drag.preview.to - drag.preview.from, maxDuration), text.relative))}</p>}
  </div>
}

// Only the fields a person edited; the others follow the value.
type Draft = { from?: string; to?: string; zone: string }
type FieldError = { field: "from" | "to"; message: string }
type FieldsState = { draft: Draft | null; error: FieldError | null }
const cleanFields: FieldsState = { draft: null, error: null }

function LiveFields({ state, setState, value, now, maxDuration, formats, escape, onApply }: { state: FieldsState;
  setState: React.Dispatch<React.SetStateAction<FieldsState>>; value: LiveTimeRange; now: number; maxDuration: number;
  formats: Formats; escape: React.RefObject<EscapeHandlers>; onApply: (value: LiveTimeRange) => void }) {
  const { zone, text } = formats
  const form = React.useRef<HTMLFormElement>(null)
  const baseId = React.useId()
  const { draft, error } = state
  const setDraft = (next: Draft | null) => setState(current => ({ ...current, draft: next }))
  const setError = (next: FieldError | null) => setState(current => ({ ...current, error: next }))
  const shown = value?.kind === "relative"
    ? (positive(value.duration) ? [relativeRangeText(value.duration), "now"] : ["", ""])
    : value?.kind === "absolute" ? [absoluteRangeText(ceilSecond(value.from), zone), absoluteRangeText(floorSecond(value.to), zone)]
    : ["", ""]
  // An edit belongs to the zone it was typed in; LiveControl discards it on a zone change.
  const edit = draft && draft.zone === zone ? draft : null
  const from = edit?.from ?? shown[0]
  const to = edit?.to ?? shown[1]
  const dirty = from !== shown[0] || to !== shown[1]
  const reset = () => setState(cleanFields)
  escape.current.fields = () => {
    if (!dirty || !form.current?.contains(document.activeElement)) return false
    reset()
    return true
  }
  const change = (field: "from" | "to", next: string) => {
    setDraft({ ...edit, zone, [field]: next })
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
  const day = (instant: number) => wallString(instant, zone, "second").slice(0, 10)
  // The calendar appears when retention covers more than one calendar day.
  const days = validInstant(now) && positive(maxDuration) && validInstant(now - maxDuration)
    ? { min: day(now - maxDuration), max: day(now) } : null
  // A picked day keeps the field's time; a relative expression resolves first.
  const pickDay = (field: "from" | "to", input: string, picked: string) => {
    const parsed = parseRangeText(input, zone, now)
    const at = parsed ? resolveRangeText(parsed, now) : now
    change(field, `${picked} ${wallString(validInstant(at) ? at : now, zone, "second").slice(11)}`)
  }
  return <form ref={form} className="time-range-live-fields" noValidate onSubmit={submit}>
    {(["from", "to"] as const).map(field => {
      const input = field === "from" ? from : to
      const id = `${baseId}-${field}`
      const failed = error?.field === field
      const parsed = parseRangeText(input, zone, now)
      const at = parsed ? resolveRangeText(parsed, now) : NaN
      return <div key={field} className="field">
        <Label htmlFor={id}>{text[field](fieldZone)}</Label>
        <div className="field-control">
          <Input id={id} value={input} autoComplete="off" spellCheck={false} aria-invalid={failed || undefined}
            aria-describedby={failed ? `${id}-help ${id}-error` : `${id}-help`} onChange={event => change(field, event.target.value)} />
          {days && days.min !== days.max && <RangeCalendar min={days.min} max={days.max} locale={formats.language}
            day={validInstant(at) ? day(at) : days.max} text={text}
            label={field === "from" ? text.chooseStartDate : text.chooseEndDate} onPick={picked => pickDay(field, input, picked)} />}
        </div>
        <small className="field-hint" id={`${id}-help`}>{hint(input)}</small>
        {failed && <ValidationMessage id={`${id}-error`} role="alert">{error.message}</ValidationMessage>}
      </div>
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
