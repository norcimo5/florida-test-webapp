/**
 * appStore.ts — everything the app remembers on the device, plus the actions that change it.
 *
 * Port of the Android app's data/ProgressStore.kt + the state half of AppViewModel.kt.
 * Storage: ONE JSON object in localStorage under STORAGE_KEY (shape: `AppState`). If storage is
 * unavailable (private browsing, quota), the app still works in memory for the session.
 *
 * React components read it with `useAppState()` (useSyncExternalStore) and change it ONLY through
 * the exported action functions, which persist and notify subscribers.
 *
 * Several copies of the app can be open at once (installed app + a browser tab share storage).
 * So every write re-reads storage first (read-modify-write), and a `storage` event listener pulls in
 * changes made by the other copy — otherwise a stale copy would overwrite newer data (e.g. Premium).
 *
 * iPhone note: Safari may delete storage of sites not added to the Home Screen after weeks without
 * use. Installed apps keep it. That's why the app nudges users to install (docs/TROUBLESHOOTING.md).
 */
import { useSyncExternalStore } from 'react'
import type { AnswerMap, MockResult } from '../domain/metrics'
import type { UnlockRecord } from '../billing/entitlement'

/** localStorage key. Bump the suffix only with a migration in `load()`. */
export const STORAGE_KEY = 'fldmv.state.v1'

/** Legacy key from the pre-2026 web app; its study answers and mock history are imported once. */
const LEGACY_PROGRESS_KEY = 'fl_driver_progress'

/** Everything persisted on the device. */
export interface AppState {
  /** null = onboarding not done yet; '' = user skipped the name; otherwise the display name. */
  userName: string | null
  /** Latest result per question id (true = correct). Drives mastery and pass probability. */
  answers: AnswerMap
  /** Completed 50-question mock exams, oldest first. */
  mocks: MockResult[]
  /** Day key of the free study counter + how many free study answers were given that day. */
  freeDay: string | null
  freeCount: number
  /** Day key of the last Daily Quiz taken (free users get one per day). */
  quizDay: string | null
  /** Saved Premium activation (email + code), re-verified on every start. */
  unlock: UnlockRecord | null
  /** User closed the "Instala la app" card on Inicio. */
  installDismissed: boolean
  /** Latest calendar day the app has seen; guards against setting the phone's date back (dates.ts). */
  lastSeenDay: string | null
}

const DEFAULT_STATE: AppState = {
  userName: null,
  answers: {},
  mocks: [],
  freeDay: null,
  freeCount: 0,
  quizDay: null,
  unlock: null,
  installDismissed: false,
  lastSeenDay: null,
}

/** Keep the mock history bounded so storage never grows without limit. */
const MAX_MOCKS = 100

let state: AppState = load()
const listeners = new Set<() => void>()

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/** Imports progress from the old web app (studyAnswers + mockHistory), if present. */
function migrateLegacy(): Partial<AppState> {
  const raw = readStorage(LEGACY_PROGRESS_KEY)
  if (!raw) return {}
  try {
    const old = JSON.parse(raw) as {
      studyAnswers?: Record<string, { correct?: boolean }>
      mockHistory?: { id?: string; scoreCorrect?: number; scoreTotal?: number }[]
    }
    const answers: AnswerMap = {}
    for (const [id, a] of Object.entries(old.studyAnswers ?? {})) answers[id] = a?.correct === true
    const mocks: MockResult[] = (old.mockHistory ?? [])
      .filter((m) => typeof m.scoreCorrect === 'number' && typeof m.scoreTotal === 'number')
      .map((m) => ({ at: Date.parse(m.id ?? '') || 0, correct: m.scoreCorrect!, total: m.scoreTotal! }))
    return { answers, mocks }
  } catch {
    return {}
  }
}

function load(): AppState {
  const raw = readStorage(STORAGE_KEY)
  if (raw) {
    try {
      return { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<AppState>) }
    } catch {
      // Corrupt JSON: start fresh rather than crash.
    }
  }
  return { ...DEFAULT_STATE, ...migrateLegacy() }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or blocked — keep working in memory.
  }
}

/** Applies a change on top of the LATEST stored state (another tab may have written), then saves. */
function update(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)): void {
  if (readStorage(STORAGE_KEY) !== null) state = load()
  const next = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...next }
  persist()
  listeners.forEach((l) => l())
}

// Another copy of the app (tab or installed app) changed storage → refresh ours.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY && e.key !== null) return
    state = load()
    listeners.forEach((l) => l())
  })
}

/** Current state snapshot (stable object until the next change). */
export function getState(): AppState {
  return state
}

/** Subscribe to changes; returns an unsubscribe function. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React hook: re-renders the component whenever the store changes. */
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState)
}

// ---------------------------------------------------------------- actions

/** Saves the onboarding name ('' = skipped). Trimmed, max 24 chars like Android. */
export function setUserName(name: string): void {
  update({ userName: name.trim().slice(0, 24) })
}

/**
 * Records an answer. Only study-mode answers by free users count toward the daily allowance;
 * quiz/mock answers pass `countsTowardDailyCap = false` (Android: AppViewModel.answer).
 */
export function recordAnswer(
  questionId: string,
  correct: boolean,
  opts: { countsTowardDailyCap: boolean; premium: boolean; today: string },
): void {
  update((s) => {
    const patch: Partial<AppState> = { answers: { ...s.answers, [questionId]: correct } }
    if (opts.countsTowardDailyCap && !opts.premium) {
      const count = s.freeDay === opts.today ? s.freeCount : 0
      patch.freeDay = opts.today
      patch.freeCount = count + 1
    }
    return patch
  })
}

/** Saves a finished 50-question mock exam. */
export function recordMock(correct: number, total: number, at: number = Date.now()): void {
  update((s) => ({ mocks: [...s.mocks, { at, correct, total }].slice(-MAX_MOCKS) }))
}

/** Marks today's free Daily Quiz as used. */
export function markDailyQuiz(today: string): void {
  update({ quizDay: today })
}

/** Saves a verified Premium activation (replaces any previous code, e.g. a monthly renewal). */
export function saveUnlock(record: UnlockRecord): void {
  update({ unlock: { email: record.email.trim().toLowerCase(), code: record.code.trim() } })
}

/** Removes Premium from this device (Ajustes → "Quitar Premium de este dispositivo"). */
export function clearUnlock(): void {
  update({ unlock: null })
}

/** Records that the app has seen `day` (only ever moves forward). */
export function noteDaySeen(day: string): void {
  if (state.lastSeenDay !== null && state.lastSeenDay >= day) return
  update((s) => (s.lastSeenDay !== null && s.lastSeenDay >= day ? {} : { lastSeenDay: day }))
}

/** Hides the install card on Inicio. */
export function dismissInstall(): void {
  update({ installDismissed: true })
}

/**
 * Clears study progress only. Deliberately KEEPS Premium and the name, exactly like Android's
 * ProgressStore.reset() — a paying user who resets progress stays Premium.
 */
export function resetProgress(): void {
  update({ answers: {}, mocks: [], freeDay: null, freeCount: 0, quizDay: null })
}

/** Test helper: replace the whole state (also used to start each test clean). */
export function __setStateForTests(next: Partial<AppState>): void {
  state = { ...DEFAULT_STATE, ...next }
  persist() // writes re-read storage, so the test state must be stored too
  listeners.forEach((l) => l())
}

/** Test helper: re-run the load from localStorage (to test persistence/migration). */
export function __reloadForTests(): void {
  state = load()
}
