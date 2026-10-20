/**
 * types.ts — shape of the bundled question bank (src/data/questions.json).
 *
 * Mirrors the Android app's data/Models.kt. The JSON is shared byte-for-byte with the Android app.
 * English (`en`) is the exam-format text; Spanish (`es`) is an optional helper translation.
 */

/** Raw category tag in questions.json. Grouped into 4 study topics by `macroTopicOf`. */
export type Category =
  | 'traffic-signals'
  | 'speed-limits'
  | 'right-of-way'
  | 'school-zones'
  | 'dui'
  | 'road-markings'
  | 'general'

/** An English exam keyword and its Spanish meaning (highlighted in study mode). */
export interface Keyword {
  en: string
  es: string
}

/** English, exam-format version of a question. `correct` is a 0-based index into `choices`. */
export interface QuestionEN {
  question: string
  choices: string[]
  correct: number
}

/** Spanish helper translation of a question (shown only on request in study mode). */
export interface QuestionES {
  question: string
  choices: string[]
}

/** One practice question from the bank. */
export interface Question {
  id: string
  en: QuestionEN
  /** null when no translation exists. */
  es: QuestionES | null
  keywords: Keyword[]
  /** Spanish "¿POR QUÉ?" explanation shown after answering. Hidden when absent. */
  explanation?: string
  category: Category
  source: string
}
