/**
 * appStore tests: persistence, the free daily counter, reset semantics, legacy migration.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  __reloadForTests,
  __setStateForTests,
  getState,
  markDailyQuiz,
  noteDaySeen,
  recordAnswer,
  recordMock,
  resetProgress,
  saveUnlock,
  setUserName,
} from '../../src/store/appStore'

beforeEach(() => __setStateForTests({}))

describe('appStore', () => {
  it('persists to localStorage and reloads', () => {
    setUserName('  María  ')
    __reloadForTests()
    expect(getState().userName).toBe('María')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).userName).toBe('María')
  })

  it('counts free study answers per day, but not quiz answers or premium answers', () => {
    const today = '2026-10-20'
    recordAnswer('q1', true, { countsTowardDailyCap: true, premium: false, today })
    recordAnswer('q2', false, { countsTowardDailyCap: true, premium: false, today })
    recordAnswer('q3', true, { countsTowardDailyCap: false, premium: false, today })
    recordAnswer('q4', true, { countsTowardDailyCap: true, premium: true, today })
    expect(getState().freeCount).toBe(2)
    expect(getState().answers).toEqual({ q1: true, q2: false, q3: true, q4: true })
    recordAnswer('q5', true, { countsTowardDailyCap: true, premium: false, today: '2026-10-21' })
    expect(getState()).toMatchObject({ freeDay: '2026-10-21', freeCount: 1 })
  })

  it('reset clears progress but keeps the name and Premium', () => {
    setUserName('Ana')
    saveUnlock({ email: 'A@B.com ', code: ' FLDMV-X ' })
    recordAnswer('q1', true, { countsTowardDailyCap: true, premium: false, today: '2026-10-20' })
    recordMock(45, 50, 1)
    markDailyQuiz('2026-10-20')
    resetProgress()
    expect(getState()).toMatchObject({
      userName: 'Ana',
      unlock: { email: 'a@b.com', code: 'FLDMV-X' },
      answers: {},
      mocks: [],
      freeCount: 0,
      quizDay: null,
    })
  })

  it('imports study answers and mock history from the old web app once', () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.setItem(
      'fl_driver_progress',
      JSON.stringify({
        studyAnswers: { a: { selectedIndex: 1, correct: true }, b: { selectedIndex: 0, correct: false } },
        mockHistory: [{ id: '2026-05-01T10:00:00.000Z', scoreCorrect: 42, scoreTotal: 50 }],
      }),
    )
    __reloadForTests()
    expect(getState().answers).toEqual({ a: true, b: false })
    expect(getState().mocks).toEqual([{ at: Date.parse('2026-05-01T10:00:00.000Z'), correct: 42, total: 50 }])
    expect(getState().userName).toBeNull()
  })

  it('a write never overwrites newer data saved by another open copy of the app', () => {
    setUserName('Ana')
    // Another tab activates Premium directly in storage; this copy's memory is now stale.
    const other = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    other.unlock = { email: 'a@b.com', code: 'FLDMV-X' }
    other.freeCount = 4
    other.freeDay = '2026-10-20'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(other))
    recordAnswer('q1', true, { countsTowardDailyCap: true, premium: false, today: '2026-10-20' })
    expect(getState().unlock).toEqual({ email: 'a@b.com', code: 'FLDMV-X' })
    expect(getState().freeCount).toBe(5)
  })

  it('remembers the latest day seen and never moves it backwards', () => {
    noteDaySeen('2026-10-20')
    noteDaySeen('2026-10-01')
    expect(getState().lastSeenDay).toBe('2026-10-20')
    noteDaySeen('2026-10-21')
    expect(getState().lastSeenDay).toBe('2026-10-21')
  })

  it('survives corrupt storage', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    __reloadForTests()
    expect(getState().answers).toEqual({})
  })
})
