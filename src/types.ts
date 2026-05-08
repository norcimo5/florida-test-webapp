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

export type Screen = 'home' | 'temas' | 'study' | 'exam' | 'results' | 'perfil' | 'ajustes'

export type MacroTopic = 'senales' | 'reglas' | 'seguridad' | 'especial'

export interface MockExamRecord {
  id: string                  // ISO timestamp
  scoreCorrect: number
  scoreTotal: number          // always 50
  takenAt: string             // ISO date
}

export interface DailyReadiness {
  date: string                // YYYY-MM-DD (America/New_York)
  readinessPct: number        // 0-100
}

export interface DailyQuizState {
  streakDays: number
  lastCompletedDate: string | null  // YYYY-MM-DD
}

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
  // NEW:
  mockHistory: MockExamRecord[]      // last 20 retained
  dailyReadiness: DailyReadiness[]   // last 30 days retained
  dailyQuiz: DailyQuizState
  masteredKeywords: string[]         // EN keyword strings
  studyAnswersWithoutHints: string[] // questionIds answered correctly with Spanish chip hidden
}

export interface AppSettings {
  examLength: 25 | 50
  userName: string             // 'TESTUSER' default
  onboardingComplete: boolean  // reserved for v2 onboarding tour; default true in v1 (no tour)
}
