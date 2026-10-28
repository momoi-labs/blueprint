// Text for the live range fields: `now`, `now-15m`, `16:37[:05]`, or
// `2026-10-28 16:37[:05]`, read in a time zone. Values stay epoch milliseconds.
import { parseWallTime, validInstant, wallString } from "./time-zone.js"

export type RangeText = { kind: "relative"; offset: number } | { kind: "absolute"; at: number }

const unitSizes = { d: 86_400_000, h: 3_600_000, m: 60_000, s: 1000 } as const
const pad = (value: number) => String(value).padStart(2, "0")

const daysIn = (year: number, month: number) => {
  const date = new Date(0)
  date.setUTCFullYear(year, month, 0)
  return date.getUTCDate()
}

function wallInstant(date: string, hour: number, minute: number, second: number, zone: string) {
  const [year, month, day] = date.split("-").map(Number)
  if (month < 1 || month > 12 || day < 1 || day > daysIn(year, month)) return NaN
  if (hour > 23 || minute > 59 || second > 59) return NaN
  return parseWallTime(`${date}T${pad(hour)}:${pad(minute)}:${pad(second)}`, zone)
}

/** Reads field text; `now` gives today's date for a time of day. Null when invalid. */
export function parseRangeText(text: string, zone: string, now: number): RangeText | null {
  const value = text.trim().toLowerCase()
  const relative = /^now(?:\s*-\s*(\d+)\s*([smhd]))?$/.exec(value)
  if (relative) {
    const offset = relative[1] ? Number(relative[1]) * unitSizes[relative[2] as keyof typeof unitSizes] : 0
    return Number.isSafeInteger(offset) ? { kind: "relative", offset } : null
  }
  const full = /^(\d{4}-\d{2}-\d{2})[ t](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  const clock = full ? null : /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  if (!full && !clock) return null
  if (clock && !validInstant(now)) return null
  const date = full ? full[1] : wallString(now, zone, "second").slice(0, 10)
  const [hour, minute, second = "0"] = (full ? full.slice(2) : clock!.slice(1)).map(part => part ?? "0")
  const at = wallInstant(date, Number(hour), Number(minute), Number(second), zone)
  return validInstant(at) ? { kind: "absolute", at } : null
}

export const resolveRangeText = (text: RangeText, now: number) => text.kind === "relative" ? now - text.offset : text.at

/** `now-30m`, in the largest unit that divides the duration. */
export function relativeRangeText(duration: number) {
  const unit = (Object.keys(unitSizes) as (keyof typeof unitSizes)[]).find(key => duration % unitSizes[key] === 0)
  return unit ? `now-${duration / unitSizes[unit]}${unit}` : `now-${Math.max(1, Math.round(duration / 1000))}s`
}

export const absoluteRangeText = (instant: number, zone: string) =>
  validInstant(instant) ? wallString(instant, zone, "second").replace("T", " ") : ""
