// Time zone helpers built on Intl only. Values stay epoch milliseconds; wall
// strings use the datetime-local shape YYYY-MM-DDTHH:mm:ss(.sss).

const formatters = new Map<string, Intl.DateTimeFormat>()

export function dateFormat(locale: string | undefined, options: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify([locale ?? "", options])
  let format = formatters.get(key)
  if (!format) formatters.set(key, format = new Intl.DateTimeFormat(locale, options))
  return format
}

export const browserTimeZone = () => {
  try { return new Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" } catch { return "UTC" }
}

export const validTimeZone = (zone: unknown): zone is string => {
  if (typeof zone !== "string" || !zone) return false
  try { dateFormat("en-US", { timeZone: zone }); return true } catch { return false }
}

export const validInstant = (value: number) => Number.isFinite(value) && Math.abs(value) <= 8.64e15

export function timeZones(): string[] {
  const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []
  return zones.includes("UTC") ? zones : [...zones, "UTC"]
}

const pad = (value: number, length = 2) => String(value).padStart(length, "0")

function wallParts(value: number, zone: string) {
  const parts: Record<string, string> = {}
  for (const part of dateFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", era: "short" }).formatToParts(value)) {
    parts[part.type] = part.value
  }
  const year = Number(parts.year)
  return { year: parts.era === "BC" || parts.era === "B" ? 1 - year : year, month: Number(parts.month),
    day: Number(parts.day), hour: Number(parts.hour) % 24, minute: Number(parts.minute), second: Number(parts.second),
    millisecond: ((value % 1000) + 1000) % 1000 }
}

const utc = (year: number, month: number, day: number, hour: number, minute: number, second: number, ms: number) => {
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(hour, minute, second, ms)
  return date.getTime()
}

/** The zone's offset from UTC at an instant, in milliseconds. */
export function zoneOffset(value: number, zone: string) {
  const wall = wallParts(value, zone)
  return utc(wall.year, wall.month, wall.day, wall.hour, wall.minute, wall.second, wall.millisecond) - value
}

/** Wall-clock time of an instant in a zone, as a datetime-local value. */
export function wallString(value: number, zone: string, precision: "second" | "millisecond") {
  if (zone === "UTC" && precision === "millisecond") return new Date(value).toISOString().slice(0, 23)
  const wall = wallParts(value, zone)
  const year = wall.year < 0 ? `-${pad(-wall.year, 6)}` : wall.year > 9999 ? `+${pad(wall.year, 6)}` : pad(wall.year, 4)
  const text = `${year}-${pad(wall.month)}-${pad(wall.day)}T${pad(wall.hour)}:${pad(wall.minute)}:${pad(wall.second)}`
  return precision === "millisecond" ? `${text}.${pad(wall.millisecond, 3)}` : text
}

/** Instant of a datetime-local wall time in a zone. A wall time inside a
    daylight-saving gap moves forward to the first valid instant; one inside an
    overlap takes the earlier instant. Returns NaN for unparsable input. */
export function parseWallTime(text: string, zone: string) {
  try { return wallInstant(text, zone) } catch { return NaN }
}

function wallInstant(text: string, zone: string) {
  const match = /^([+-]\d{6}|\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(text)
  if (!match) return NaN
  const [year, month, day, hour, minute, second = 0] = match.slice(1, 7).map(part => Number(part ?? 0))
  const ms = Number((match[7] ?? "").padEnd(3, "0"))
  const wall = utc(year, month, day, hour, minute, second, ms)
  if (!validInstant(wall) || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return NaN
  if (zone === "UTC") return wall
  const oneDay = 86_400_000
  const before = zoneOffset(wall - oneDay, zone)
  const after = zoneOffset(wall + oneDay, zone)
  const same = (value: number) => {
    const parts = wallParts(value, zone)
    return utc(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second, parts.millisecond) === wall
  }
  const candidates = [...new Set([wall - before, wall - after])].filter(same)
  if (candidates.length) return Math.min(...candidates)
  if (before === after) return NaN
  // In a gap: find the transition instant between both readings.
  let low = Math.min(wall - before, wall - after)
  let high = Math.max(wall - before, wall - after)
  const target = zoneOffset(high, zone)
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (zoneOffset(middle, zone) === target) high = middle
    else low = middle
  }
  return high
}

/** A short zone name at an instant, such as "UTC" or "GMT-3". */
export function zoneName(value: number, zone: string, locale?: string) {
  if (zone === "UTC") return "UTC"
  const at = validInstant(value) ? value : Date.now()
  return dateFormat(locale, { timeZone: zone, timeZoneName: "short" }).formatToParts(at)
    .find(part => part.type === "timeZoneName")?.value ?? zone
}
