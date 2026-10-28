import { validInstant } from "./time-zone.js"

export type TimeRange = { from: number; to: number }
/** A live value: relative follows the wall clock, absolute is paused. */
export type LiveTimeRange = { kind: "relative"; duration: number } | { kind: "absolute"; from: number; to: number }
export type TimeRangePreset = { label: string; duration: number }
export type TimeRangeUnit = "second" | "minute" | "hour" | "day"
export type TimeRangeState = "live" | "paused"

export const defaultLabels = {
  entireRun: "Entire run",
  custom: "Custom range",
  backToPresets: "Back to presets",
  backToLive: "Back to live",
  apply: "Apply range",
  from: (zone: string) => `From (${zone})`,
  to: (zone: string) => `To (${zone})`,
  error: "Choose a start before the end, within the collection window.",
  presets: "Presets",
  live: "Live",
  paused: "Paused",
  pause: "Pause",
  resume: "Resume live",
  reset: "Reset",
  relative: (count: number, unit: TimeRangeUnit) => `Last ${count} ${unit}${count === 1 ? "" : "s"}`,
  duration: (count: number, unit: TimeRangeUnit) => `${count} ${unit}${count === 1 ? "" : "s"}`,
  /** Visible range text: short times and the zone name. */
  range: (from: string, to: string, zone: string) => `${from} to ${to} ${zone}`,
  /** Full timestamps for the tooltip and the accessible name. */
  fullRange: (from: string, to: string) => `${from} to ${to}`,
  triggerName: ({ label, state, text, range }: { label: string; state: string; text: string; range: string }) =>
    `${label}, ${state}: ${text}, ${range}`,
  now: "now",
  keeps: (duration: string) => `Keeps ${duration}.`,
  olderThanRetention: "This range is older than the data kept.",
  releaseToLive: (text: string) => `Release to follow the clock: ${text}.`,
  fieldHint: "Use now-15m, a time like 16:37, or 2026-10-28 16:37:05.",
  resolvedHint: (time: string, followsClock: boolean) => followsClock ? `${time}, follows the clock` : time,
  invalidStart: "Enter a start like now-15m, 16:37, or 2026-10-28 16:37:05.",
  invalidEnd: "Enter an end like now, 16:37, or 2026-10-28 16:37:05.",
  order: "The start must be before the end.",
  retention: "The start must be within the data kept.",
  future: "The end cannot be in the future.",
  moveRange: "Move range",
  rangeStart: "Range start",
  rangeEnd: "Range end",
  chooseStartDate: "Choose start date",
  chooseEndDate: "Choose end date",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  outsideRetention: "outside the data kept",
  timeZone: "Time zone",
  timeZoneButton: (zone: string) => `Time zone: ${zone}`,
  browserTimeZone: (zone: string) => `Browser time zone (${zone})`,
  utc: "UTC",
  searchTimeZones: "Search time zones",
  noTimeZones: "No matching time zones.",
  unavailable: "Time unavailable",
}
export type TimeRangeControlLabels = typeof defaultLabels

export const defaultPresets = [
  { label: "Last 5 minutes", duration: 300_000 },
  { label: "Last 15 minutes", duration: 900_000 },
  { label: "Last 30 minutes", duration: 1_800_000 },
]

export const validRange = (range: TimeRange) => validInstant(range.from) && validInstant(range.to) && range.from < range.to
export const units: [TimeRangeUnit, number][] = [["day", 86_400_000], ["hour", 3_600_000], ["minute", 60_000], ["second", 1000]]
export const positive = (value: number) => Number.isFinite(value) && value > 0
export const ceilSecond = (value: number) => Math.ceil(value / 1000) * 1000
export const floorSecond = (value: number) => Math.floor(value / 1000) * 1000

export function documentLocale() {
  return typeof document === "undefined" ? undefined : document.documentElement.lang || undefined
}

export function validLocale(locale: string | undefined) {
  if (locale === undefined) return undefined
  try { return Intl.getCanonicalLocales(locale)[0] } catch { return undefined }
}

/** A duration in the largest unit that divides it, through a label template. */
export function durationText(duration: number, template: (count: number, unit: TimeRangeUnit) => string) {
  const [unit, size] = units.find(([, size]) => duration % size === 0) ?? ["second", 1000]
  return template(Math.max(1, Math.round(duration / size)), unit)
}
