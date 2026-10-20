/**
 * dates.ts — calendar-day helpers shared by the free-tier counters and Premium expiry.
 *
 * A "day key" is a local ISO date string like "2026-10-20" (Android: LocalDate.now().toString()).
 * Day numbers are whole days since 1970-01-01, used for date math without time-zone surprises.
 */

/** Local-date day key for `date` (defaults to now), e.g. "2026-10-20". */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Whole days since 1970-01-01 for a day key. Throws on a malformed key. */
export function dayNumber(key: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!m) throw new Error(`Invalid day key: ${key}`)
  return Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000)
}

/** Day key for a day number (inverse of `dayNumber`). */
export function fromDayNumber(n: number): string {
  return new Date(n * 86_400_000).toISOString().slice(0, 10)
}

/** `key` plus `days` days. */
export function addDays(key: string, days: number): string {
  return fromDayNumber(dayNumber(key) + days)
}

/**
 * How far ahead of the phone's clock a remembered day may be and still be trusted (≈ 2 months).
 * Larger gaps mean the clock was once wrong in the future, so we trust the clock again.
 */
export const MAX_CLOCK_ROLLBACK_DAYS = 62

/**
 * The day the app should use as "today": the later of the phone's clock day and the latest day the
 * app has already seen. Setting the phone's date back therefore can't extend a monthly plan or reset
 * the free daily counters. A remembered day more than MAX_CLOCK_ROLLBACK_DAYS ahead of the clock is
 * ignored, so an honest user whose clock was once far in the future isn't locked out forever.
 */
export function effectiveDay(clockDay: string, lastSeenDay: string | null): string {
  if (!lastSeenDay || lastSeenDay <= clockDay) return clockDay
  return dayNumber(lastSeenDay) - dayNumber(clockDay) <= MAX_CLOCK_ROLLBACK_DAYS ? lastSeenDay : clockDay
}

/** Milliseconds from `now` until just after the next local midnight. */
export function msUntilNextLocalMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)
  return next.getTime() - now.getTime()
}

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** Spanish long date for a day key: "20 de octubre de 2026". */
export function formatDayEs(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return `${d} de ${MONTHS_ES[m - 1]} de ${y}`
}
