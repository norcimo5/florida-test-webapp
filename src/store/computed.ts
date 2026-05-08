import type { Progress, Question, MacroTopic, MockExamRecord, Category } from '../types'
import { pushDailyReadiness } from './progressStore'

// ─── Macro-topic mapping ─────────────────────────────────────────────────────

export const MACRO_TOPIC_MAP: Record<MacroTopic, Category[]> = {
  senales: ['traffic-signals', 'road-markings'],
  reglas: ['right-of-way', 'speed-limits'],
  seguridad: ['dui', 'general'],
  especial: ['school-zones'],
}

export const MACRO_TOPIC_LABELS: Record<MacroTopic, string> = {
  senales: 'Señales de Tráfico',
  reglas: 'Reglas del Camino',
  seguridad: 'Seguridad y Leyes',
  especial: 'Conducción Especial',
}

// ─── Helper: today's date in America/New_York TZ ────────────────────────────

function todayNY(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2') // MM/DD/YYYY → YYYY-MM-DD
}

// ─── Derived metrics ─────────────────────────────────────────────────────────

/**
 * Returns the mastery percentage for a given macro topic.
 * = (# study answers that are correct in this topic) / (# questions in this topic) × 100, rounded.
 * Returns 0 if there are no questions in the topic.
 */
export function topicMasteryPct(
  progress: Progress,
  questions: Question[],
  topic: MacroTopic,
): number {
  const categories = MACRO_TOPIC_MAP[topic]
  const topicQuestions = questions.filter(q => categories.includes(q.category))
  const total = topicQuestions.length
  if (total === 0) return 0
  const correct = topicQuestions.filter(q => {
    const ans = progress.studyAnswers[q.id]
    return ans?.correct === true
  }).length
  return Math.round((correct / total) * 100)
}

/**
 * Arithmetic mean of all 4 topic mastery percentages, rounded to nearest integer.
 */
export function passProbabilityPct(progress: Progress, questions: Question[]): number {
  const topics: MacroTopic[] = ['senales', 'reglas', 'seguridad', 'especial']
  const total = topics.reduce((sum, t) => sum + topicMasteryPct(progress, questions, t), 0)
  return Math.round(total / topics.length)
}

/**
 * Count of unique EN keywords that appear in at least 1 question answered
 * correctly with the Spanish chip hidden (studyAnswersWithoutHints).
 * Per FR-4: threshold is ≥1 appearance (lowered from 3 because most keywords
 * appear in only 1–2 questions across the 120-bank).
 */
export function masteredKeywordsCount(progress: Progress): number {
  const hintsHidden = new Set(progress.studyAnswersWithoutHints)
  if (hintsHidden.size === 0) return 0

  // We only have question IDs, not the questions themselves, so we rely on
  // progress.masteredKeywords which is maintained by the study flow.
  // However this function is also used standalone; if masteredKeywords is
  // populated, count those. If we need to compute from scratch we'd need
  // questions — but the store only has IDs.
  // Per spec: masteredKeywords is the canonical list maintained at answer time.
  return progress.masteredKeywords.length
}

/**
 * Record today's readiness percentage into progress.dailyReadiness.
 * If today already exists, replace; otherwise append.
 * Trims to last 30 entries.
 */
export function recordDailyReadiness(progress: Progress, questions: Question[]): Progress {
  const today = todayNY()
  const readinessPct = passProbabilityPct(progress, questions)
  return pushDailyReadiness(progress, { date: today, readinessPct })
}

/**
 * Returns true iff the last 3 dailyReadiness entries all have readinessPct ≥ 80.
 */
export function shouldShowReadyChip(progress: Progress): boolean {
  const entries = progress.dailyReadiness
  if (entries.length < 3) return false
  const last3 = entries.slice(-3)
  return last3.every(e => e.readinessPct >= 80)
}

/**
 * Returns the last n mock exam records (newest last in source array).
 */
export function getRecentMockScores(progress: Progress, n: number): MockExamRecord[] {
  return progress.mockHistory.slice(-n)
}

/**
 * Returns true iff the streak is still active today.
 * Active = lastCompletedDate is today or yesterday (NY TZ).
 */
export function isStreakActive(progress: Progress, today: string): boolean {
  const last = progress.dailyQuiz.lastCompletedDate
  if (!last) return false
  if (last === today) return true
  // Check if last was yesterday
  const todayDate = new Date(today)
  const yesterday = new Date(todayDate)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)
  return last === yesterdayStr
}

/**
 * Increment the streak counter for today. Rules:
 * - Same day: no increment (idempotent).
 * - +1 day: increment by 1.
 * - ≥2 days gap: reset to 1.
 */
export function incrementStreak(progress: Progress, today: string): Progress {
  const last = progress.dailyQuiz.lastCompletedDate

  if (last === today) {
    // Already counted for today — idempotent
    return progress
  }

  let newStreak: number
  if (!last) {
    newStreak = 1
  } else {
    const todayDate = new Date(today)
    const lastDate = new Date(last)
    const diffMs = todayDate.getTime() - lastDate.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      newStreak = progress.dailyQuiz.streakDays + 1
    } else {
      // Gap ≥ 2 days — reset
      newStreak = 1
    }
  }

  return {
    ...progress,
    dailyQuiz: {
      streakDays: newStreak,
      lastCompletedDate: today,
    },
  }
}
