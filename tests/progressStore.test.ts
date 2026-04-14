import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadProgress,
  saveProgress,
  loadSettings,
  saveSettings,
  clearExam,
  clearAll,
  isLocalStorageAvailable,
} from '../src/store/progressStore'

describe('progressStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default progress when nothing stored', () => {
    const p = loadProgress()
    expect(p.studyAnswers).toEqual({})
    expect(p.bookmarks).toEqual([])
    expect(p.examAnswers).toEqual([])
    expect(p.examComplete).toBe(false)
    expect(p.examQuestionIds).toEqual([])
  })

  it('saves and reloads progress', () => {
    const p = loadProgress()
    p.studyAnswers['q_0001'] = { selectedIndex: 2, correct: true }
    saveProgress(p)
    const loaded = loadProgress()
    expect(loaded.studyAnswers['q_0001'].selectedIndex).toBe(2)
    expect(loaded.studyAnswers['q_0001'].correct).toBe(true)
  })

  it('saves and reloads bookmarks', () => {
    const p = loadProgress()
    p.bookmarks = ['q_0001', 'q_0003']
    saveProgress(p)
    expect(loadProgress().bookmarks).toEqual(['q_0001', 'q_0003'])
  })

  it('clearExam resets exam data only', () => {
    const p = loadProgress()
    p.studyAnswers['q_0001'] = { selectedIndex: 2, correct: true }
    p.bookmarks = ['q_0001']
    p.examAnswers = [{ questionId: 'q_0001', selectedIndex: 1 }]
    p.examComplete = true
    const cleared = clearExam(p)
    expect(cleared.examAnswers).toEqual([])
    expect(cleared.examComplete).toBe(false)
    expect(cleared.examQuestionIds).toEqual([])
    expect(cleared.studyAnswers['q_0001'].selectedIndex).toBe(2)
    expect(cleared.bookmarks).toContain('q_0001')
  })

  it('clearAll removes all stored data', () => {
    const p = loadProgress()
    p.bookmarks = ['q_0001']
    saveProgress(p)
    clearAll()
    expect(loadProgress().bookmarks).toEqual([])
  })

  it('returns default settings when nothing stored', () => {
    expect(loadSettings().examLength).toBe(50)
  })

  it('saves and reloads settings', () => {
    saveSettings({ examLength: 25 })
    expect(loadSettings().examLength).toBe(25)
  })

  it('isLocalStorageAvailable returns true in test env', () => {
    expect(isLocalStorageAvailable()).toBe(true)
  })
})
