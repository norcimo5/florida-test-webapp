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

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** Spanish long date for a day key: "20 de octubre de 2026". */
export function formatDayEs(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return `${d} de ${MONTHS_ES[m - 1]} de ${y}`
}
