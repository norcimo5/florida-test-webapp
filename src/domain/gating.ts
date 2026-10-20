/**
 * gating.ts — free-tier limits (what a non-Premium user may do).
 *
 * Port of the Android app's `object Gating` (domain/Metrics.kt). Pure and clock-free: callers pass
 * day keys ("2026-10-20", see domain/dates.ts) so this file never reads the clock.
 *
 * Free:    5 study questions per calendar day + one 5-question Daily Quiz per day.
 * Premium: unlimited study, unlimited quizzes, and the 50-question Full Mock Exam.
 * To change the free allowance, edit FREE_PER_DAY (and the paywall/store copy that mentions "5").
 */

/** Study questions a free user may answer per calendar day. */
export const FREE_PER_DAY = 5

/** May the user answer another study question today? */
export function studyAllowed(premium: boolean, answeredToday: number): boolean {
  return premium || answeredToday < FREE_PER_DAY
}

/** May the user start a Daily Quiz now? Free users get one per calendar day. */
export function dailyQuizAllowed(premium: boolean, lastQuizDay: string | null, today: string): boolean {
  return premium || lastQuizDay !== today
}

/** The 50-question Full Mock Exam is Premium-only. */
export function fullMockAllowed(premium: boolean): boolean {
  return premium
}

/** Today's effective count from a stored (day, count) pair — resets to 0 when the day changes. */
export function countForDay(storedDay: string | null, storedCount: number, dayKey: string): number {
  return storedDay === dayKey ? storedCount : 0
}

/** Free questions left today (never negative). Shown in the study header. */
export function freeLeftToday(answeredToday: number): number {
  return Math.max(0, FREE_PER_DAY - answeredToday)
}
