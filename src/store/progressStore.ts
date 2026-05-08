import type { Progress, AppSettings, MockExamRecord, DailyReadiness } from '../types'

const PROGRESS_KEY = 'fl_driver_progress'
const SETTINGS_KEY = 'fl_driver_settings'

const defaultProgress: Progress = {
  studyAnswers: {},
  bookmarks: [],
  examQuestionIds: [],
  examAnswers: [],
  examComplete: false,
  mockHistory: [],
  dailyReadiness: [],
  dailyQuiz: { streakDays: 0, lastCompletedDate: null },
  masteredKeywords: [],
  studyAnswersWithoutHints: [],
}

const defaultSettings: AppSettings = {
  examLength: 50,
  userName: 'TESTUSER',
  onboardingComplete: true,
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

/** Migrate a loaded Progress object — fill any missing new fields from defaults. */
function migrateProgress(loaded: Partial<Progress>): Progress {
  const migrated: Progress = {
    ...defaultProgress,
    ...loaded,
  }
  return migrated
}

/** Migrate a loaded AppSettings object — fill any missing new fields from defaults. */
function migrateSettings(loaded: Partial<AppSettings>): AppSettings {
  return {
    ...defaultSettings,
    ...loaded,
  }
}

export function loadProgress(): Progress {
  const raw = safeGet<Partial<Progress>>(PROGRESS_KEY, structuredClone(defaultProgress))
  const migrated = migrateProgress(raw)
  // Re-save if migration added new fields
  safeSet(PROGRESS_KEY, migrated)
  return migrated
}

export function saveProgress(progress: Progress): void {
  safeSet(PROGRESS_KEY, progress)
}

export function loadSettings(): AppSettings {
  const raw = safeGet<Partial<AppSettings>>(SETTINGS_KEY, structuredClone(defaultSettings))
  const migrated = migrateSettings(raw)
  // Re-save if migration added new fields
  safeSet(SETTINGS_KEY, migrated)
  return migrated
}

export function saveSettings(settings: AppSettings): void {
  safeSet(SETTINGS_KEY, settings)
}

export function clearExam(progress: Progress): Progress {
  return {
    ...progress,
    examQuestionIds: [],
    examAnswers: [],
    examComplete: false,
  }
}

export function clearAll(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY)
    localStorage.removeItem(SETTINGS_KEY)
  } catch {
    // ignore
  }
}

export function isLocalStorageAvailable(): boolean {
  try {
    const key = '__fl_test__'
    localStorage.setItem(key, '1')
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

// ─── Helper setters (pure — return new Progress/Settings) ────────────────────

/** Append a mock exam record, trimming to last 20. */
export function pushMockExamRecord(progress: Progress, record: MockExamRecord): Progress {
  const history = [...progress.mockHistory, record]
  return {
    ...progress,
    mockHistory: history.slice(-20),
  }
}

/** Append or replace today's daily readiness entry, trimming to last 30 days. */
export function pushDailyReadiness(progress: Progress, entry: DailyReadiness): Progress {
  const list = [...progress.dailyReadiness]
  const lastIdx = list.length - 1
  if (lastIdx >= 0 && list[lastIdx].date === entry.date) {
    list[lastIdx] = entry
  } else {
    list.push(entry)
  }
  return {
    ...progress,
    dailyReadiness: list.slice(-30),
  }
}

/** Update the userName in settings. */
export function setUserName(settings: AppSettings, name: string): AppSettings {
  return { ...settings, userName: name }
}
