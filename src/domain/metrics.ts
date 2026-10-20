/**
 * metrics.ts — progress math: topic mastery, pass probability, mock-exam scoring.
 *
 * Port of the Android app's domain/Metrics.kt (object Metrics + MockResult).
 * Pure functions, unit-tested in tests/domain/metrics.test.ts.
 */
import { MACRO_TOPICS, macroTopicOf, type MacroTopic } from './macroTopic'
import type { Question } from './types'

/** Latest answer per question id: true = answered correctly last time. */
export type AnswerMap = Record<string, boolean>

/** A completed 50-question mock exam (Examen Completo). */
export interface MockResult {
  /** When it was finished (epoch milliseconds). */
  at: number
  correct: number
  total: number
}

/** The real Florida Class E pass mark: 40 of 50 = 80%. */
export const PASS_PCT = 80

/** Mock exam length (matches the real exam). */
export const FULL_MOCK_LENGTH = 50

/** Daily quiz length. */
export const DAILY_QUIZ_LENGTH = 5

/** Rounds like Kotlin's Math.round(Float): halves round up. */
function round(n: number): number {
  return Math.floor(n + 0.5)
}

/** Score as a whole percentage (0 when total is 0). */
export function scorePct(correct: number, total: number): number {
  return total === 0 ? 0 : round((correct * 100) / total)
}

/** True when a score meets the 80% pass mark. */
export function passed(correct: number, total: number): boolean {
  return scorePct(correct, total) >= PASS_PCT
}

/** Topic mastery % = questions in the topic last answered correctly / all questions in the topic. */
export function topicMasteryPct(answers: AnswerMap, questions: Question[], topic: MacroTopic): number {
  const inTopic = questions.filter((q) => macroTopicOf(q.category) === topic)
  if (inTopic.length === 0) return 0
  const correct = inTopic.filter((q) => answers[q.id] === true).length
  return round((correct * 100) / inTopic.length)
}

/** Pass probability = average of the four topic mastery percentages (shown on Inicio). */
export function passProbabilityPct(answers: AnswerMap, questions: Question[]): number {
  const pcts = MACRO_TOPICS.map((t) => topicMasteryPct(answers, questions, t))
  return round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
}
