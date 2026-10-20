/**
 * questions.ts — the bundled 120-question 2026 Florida Class E practice bank.
 *
 * questions.json is identical to the Android app's app/src/main/assets/questions.json. It is
 * bundled into the JavaScript (and cached by the service worker), so the app works offline.
 * To add or edit questions see docs/UPGRADING.md → "Adding questions".
 */
import raw from './questions.json'
import type { Question } from '../domain/types'

/** All questions, in file order. */
export const QUESTIONS: Question[] = raw as Question[]

/** Returns a shuffled copy (Fisher–Yates). `random` is injectable for tests. */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** `n` random questions from the whole bank (Daily Quiz = 5, Full Mock = 50). */
export function sampleExam(n: number, random: () => number = Math.random): Question[] {
  return shuffled(QUESTIONS, random).slice(0, n)
}
