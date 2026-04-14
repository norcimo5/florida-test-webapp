import type { Progress, AppSettings } from '../types'

const PROGRESS_KEY = 'fl_driver_progress'
const SETTINGS_KEY = 'fl_driver_settings'

const defaultProgress: Progress = {
  studyAnswers: {},
  bookmarks: [],
  examQuestionIds: [],
  examAnswers: [],
  examComplete: false,
}

const defaultSettings: AppSettings = {
  examLength: 50,
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

export function loadProgress(): Progress {
  return safeGet(PROGRESS_KEY, structuredClone(defaultProgress))
}

export function saveProgress(progress: Progress): void {
  safeSet(PROGRESS_KEY, progress)
}

export function loadSettings(): AppSettings {
  return safeGet(SETTINGS_KEY, structuredClone(defaultSettings))
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
