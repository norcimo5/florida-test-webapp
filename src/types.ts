export type Category =
  | 'traffic-signals'
  | 'speed-limits'
  | 'right-of-way'
  | 'school-zones'
  | 'dui'
  | 'road-markings'
  | 'general'

export interface Keyword {
  en: string
  es: string
}

export interface QuestionEN {
  question: string
  choices: string[]
  correct: number // 0-based index into choices array
}

export interface QuestionES {
  question: string
  choices: string[]
}

export interface Question {
  id: string
  en: QuestionEN
  es: QuestionES | null // null = translation unavailable
  keywords: Keyword[]
  explanation?: string  // Spanish explanation shown after answering. Hidden if absent.
  category: Category
  source: string
}

export type Screen = 'home' | 'study' | 'exam' | 'results'

export interface StudyAnswer {
  selectedIndex: number
  correct: boolean
}

export interface ExamAnswer {
  questionId: string
  selectedIndex: number | null
}

export interface Progress {
  studyAnswers: Record<string, StudyAnswer> // questionId -> answer
  bookmarks: string[]                        // questionIds
  examQuestionIds: string[]                  // ordered list for current exam
  examAnswers: ExamAnswer[]
  examComplete: boolean
}

export interface AppSettings {
  examLength: 25 | 50
}
