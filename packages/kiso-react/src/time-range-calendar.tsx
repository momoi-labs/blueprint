"use client"

import * as React from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./button.js"
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js"
import { dateFormat } from "./time-zone.js"
import type { TimeRangeControlLabels } from "./time-range-shared.js"

// Calendar dates are YYYY-MM-DD strings; arithmetic runs on UTC midnights so
// no time zone or daylight-saving change can shift a day.
const toDate = (day: string) => new Date(`${day}T00:00:00Z`)
const toDay = (date: Date) => date.toISOString().slice(0, 10)
const addDays = (day: string, count: number) => {
  const date = toDate(day)
  date.setUTCDate(date.getUTCDate() + count)
  return toDay(date)
}
const addMonths = (day: string, count: number) => {
  const date = toDate(day)
  const target = date.getUTCDate()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + count)
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  date.setUTCDate(Math.min(target, last))
  return toDay(date)
}

/** The first day of the week for a locale, 0 for Sunday; Monday when unknown. */
function weekStart(locale: string | undefined) {
  try {
    const info = new Intl.Locale(locale ?? "und") as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } }
    const firstDay = (info.getWeekInfo?.() ?? info.weekInfo)?.firstDay
    return typeof firstDay === "number" ? firstDay % 7 : 1
  } catch { return 1 }
}

/** A month grid that picks one day between `min` and `max`, opened from an icon button. */
export function RangeCalendar({ day, min, max, locale, label, text, onPick }: { day: string; min: string; max: string;
  locale: string | undefined; label: string; text: TimeRangeControlLabels; onPick: (day: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const [focus, setFocus] = React.useState(day)
  const grid = React.useRef<HTMLTableElement>(null)
  const clamp = (value: string) => value < min ? min : value > max ? max : value
  const first = weekStart(locale)
  const month = focus.slice(0, 7)
  const start = `${month}-01`
  const lead = (toDate(start).getUTCDay() - first + 7) % 7
  const weeks: string[][] = []
  for (let cursor = addDays(start, -lead); weeks.length < 6 && (weeks.length < 4 || cursor.slice(0, 7) === month);) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(cursor, index)))
    cursor = addDays(cursor, 7)
  }
  const utc = (options: Intl.DateTimeFormatOptions) => dateFormat(locale, { timeZone: "UTC", ...options })
  const title = utc({ month: "long", year: "numeric" }).format(toDate(start))
  const allowed = (value: string) => value >= min && value <= max
  const moved = React.useRef(false)
  React.useEffect(() => {
    if (moved.current) grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focus}"]`)?.focus()
    moved.current = false
  }, [focus])
  const move = (next: string) => { moved.current = true; setFocus(next) }
  const pick = (value: string) => {
    if (!allowed(value)) return
    onPick(value)
    setOpen(false)
  }
  const key = (event: React.KeyboardEvent) => {
    const dow = (toDate(focus).getUTCDay() - first + 7) % 7
    const next: Record<string, () => string> = {
      ArrowLeft: () => addDays(focus, -1), ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7), ArrowDown: () => addDays(focus, 7),
      Home: () => addDays(focus, -dow), End: () => addDays(focus, 6 - dow),
      PageUp: () => addMonths(focus, -1), PageDown: () => addMonths(focus, 1),
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      pick(focus)
    } else if (next[event.key]) {
      event.preventDefault()
      move(next[event.key]())
    }
  }
  const firstMonth = min.slice(0, 7), lastMonth = max.slice(0, 7)
  return <Popover open={open} onOpenChange={next => { setOpen(next); if (next) setFocus(clamp(day)) }}>
    <PopoverTrigger asChild>
      <Button type="button" variant="ghost" size="sm" className="btn-icon time-range-live-date" aria-label={label}>
        <CalendarDays className="icon icon-sm" aria-hidden="true" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="time-range-calendar" aria-label={label} align="end"
      onOpenAutoFocus={event => {
        // Focus starts on the field's day, not the first button.
        event.preventDefault()
        const content = event.currentTarget as HTMLElement | null
        requestAnimationFrame(() => content?.querySelector<HTMLButtonElement>(`[data-day="${clamp(day)}"]`)?.focus())
      }}>
      <div className="time-range-calendar-head">
        <Button type="button" variant="ghost" size="sm" className="btn-icon" aria-label={text.previousMonth}
          disabled={month <= firstMonth} onClick={() => move(clamp(addMonths(focus, -1)))}>
          <ChevronLeft className="icon icon-sm" aria-hidden="true" />
        </Button>
        <strong aria-live="polite">{title}</strong>
        <Button type="button" variant="ghost" size="sm" className="btn-icon" aria-label={text.nextMonth}
          disabled={month >= lastMonth} onClick={() => move(clamp(addMonths(focus, 1)))}>
          <ChevronRight className="icon icon-sm" aria-hidden="true" />
        </Button>
      </div>
      <table ref={grid} role="grid" aria-label={title} onKeyDown={key}>
        <thead><tr>{weeks[0].map(value => <th key={value} scope="col" abbr={utc({ weekday: "long" }).format(toDate(value))}>
          {utc({ weekday: "narrow" }).format(toDate(value))}</th>)}</tr></thead>
        <tbody>{weeks.map(week => <tr key={week[0]}>{week.map(value => {
          const inside = allowed(value)
          return <td key={value} role="gridcell" aria-selected={value === day}>
            <button type="button" className="time-range-calendar-day" data-day={value} data-outside={value.slice(0, 7) !== month || undefined}
              tabIndex={value === focus ? 0 : -1} aria-disabled={!inside || undefined} aria-current={value === max ? "date" : undefined}
              aria-label={`${utc({ weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(toDate(value))}${inside ? "" : `, ${text.outsideRetention}`}`}
              onClick={() => { setFocus(value); pick(value) }}>
              {Number(value.slice(8))}
            </button>
          </td>
        })}</tr>)}</tbody>
      </table>
    </PopoverContent>
  </Popover>
}
