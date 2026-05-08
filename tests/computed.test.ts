import { describe, it, expect } from 'vitest'
import type { Progress, Question } from '../src/types'
import {
  topicMasteryPct,
  passProbabilityPct,
  masteredKeywordsCount,
  shouldShowReadyChip,
  getRecentMockScores,
  isStreakActive,
  incrementStreak,
  recordDailyReadiness,
} from '../src/store/computed'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const baseProgress: Progress = {
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

const mockQuestions: Question[] = [
  // senales (traffic-signals + road-markings): 2 + 2 = 4 questions
  {
    id: 'q_ts_1',
    en: { question: 'Q1', choices: ['A', 'B'], correct: 0 },
    es: null,
    keywords: [{ en: 'stop sign', es: 'señal de pare' }],
    category: 'traffic-signals',
    source: 'test',
  },
  {
    id: 'q_ts_2',
    en: { question: 'Q2', choices: ['A', 'B'], correct: 0 },
    es: null,
    keywords: [{ en: 'yield', es: 'ceder' }],
    category: 'traffic-signals',
    source: 'test',
  },
  {
    id: 'q_rm_1',
    en: { question: 'Q3', choices: ['A', 'B'], correct: 1 },
    es: null,
    keywords: [{ en: 'center line', es: 'línea central' }],
    category: 'road-markings',
    source: 'test',
  },
  {
    id: 'q_rm_2',
    en: { question: 'Q4', choices: ['A', 'B'], correct: 1 },
    es: null,
    keywords: [{ en: 'double yellow', es: 'doble amarilla' }],
    category: 'road-markings',
    source: 'test',
  },
  // reglas (right-of-way + speed-limits): 2 questions
  {
    id: 'q_rw_1',
    en: { question: 'Q5', choices: ['A', 'B'], correct: 0 },
    es: null,
    keywords: [{ en: 'right of way', es: 'derecho de vía' }],
    category: 'right-of-way',
    source: 'test',
  },
  {
    id: 'q_sl_1',
    en: { question: 'Q6', choices: ['A', 'B'], correct: 0 },
    es: null,
    keywords: [{ en: 'speed limit', es: 'límite de velocidad' }],
    category: 'speed-limits',
    source: 'test',
  },
  // seguridad (dui + general): 2 questions
  {
    id: 'q_dui_1',
    en: { question: 'Q7', choices: ['A', 'B'], correct: 0 },
    es: null,
    keywords: [{ en: 'DUI', es: 'conducir ebrio' }],
    category: 'dui',
    source: 'test',
  },
  {
    id: 'q_gen_1',
    en: { question: 'Q8', choices: ['A', 'B'], correct: 0 },
    es: null,
    keywords: [{ en: 'license', es: 'licencia' }],
    category: 'general',
    source: 'test',
  },
  // especial (school-zones): 2 questions
  {
    id: 'q_sz_1',
    en: { question: 'Q9', choices: ['A', 'B'], correct: 0 },
    es: null,
    keywords: [{ en: 'school zone', es: 'zona escolar' }],
    category: 'school-zones',
    source: 'test',
  },
  {
    id: 'q_sz_2',
    en: { question: 'Q10', choices: ['A', 'B'], correct: 0 },
    es: null,
    keywords: [{ en: 'flashing lights', es: 'luces intermitentes' }],
    category: 'school-zones',
    source: 'test',
  },
]

// ─── topicMasteryPct ─────────────────────────────────────────────────────────

describe('topicMasteryPct', () => {
  it('returns 0 when no answers for the topic', () => {
    expect(topicMasteryPct(baseProgress, mockQuestions, 'senales')).toBe(0)
  })

  it('returns 100 when all topic questions are answered correctly', () => {
    const progress: Progress = {
      ...baseProgress,
      studyAnswers: {
        q_ts_1: { selectedIndex: 0, correct: true },
        q_ts_2: { selectedIndex: 0, correct: true },
        q_rm_1: { selectedIndex: 1, correct: true },
        q_rm_2: { selectedIndex: 1, correct: true },
      },
    }
    expect(topicMasteryPct(progress, mockQuestions, 'senales')).toBe(100)
  })

  it('returns 50 when half of topic questions are correct', () => {
    const progress: Progress = {
      ...baseProgress,
      studyAnswers: {
        q_ts_1: { selectedIndex: 0, correct: true },
        q_ts_2: { selectedIndex: 1, correct: false },
        q_rm_1: { selectedIndex: 1, correct: true },
        q_rm_2: { selectedIndex: 0, correct: false },
      },
    }
    expect(topicMasteryPct(progress, mockQuestions, 'senales')).toBe(50)
  })

  it('returns 0 when all answers are wrong', () => {
    const progress: Progress = {
      ...baseProgress,
      studyAnswers: {
        q_ts_1: { selectedIndex: 1, correct: false },
        q_ts_2: { selectedIndex: 1, correct: false },
        q_rm_1: { selectedIndex: 0, correct: false },
        q_rm_2: { selectedIndex: 0, correct: false },
      },
    }
    expect(topicMasteryPct(progress, mockQuestions, 'senales')).toBe(0)
  })

  it('returns 0 when questions array is empty (defensive)', () => {
    expect(topicMasteryPct(baseProgress, [], 'senales')).toBe(0)
  })

  it('does not count other topics toward the result', () => {
    // Only answer reglas questions correctly
    const progress: Progress = {
      ...baseProgress,
      studyAnswers: {
        q_rw_1: { selectedIndex: 0, correct: true },
        q_sl_1: { selectedIndex: 0, correct: true },
      },
    }
    // senales should still be 0
    expect(topicMasteryPct(progress, mockQuestions, 'senales')).toBe(0)
    // reglas should be 100
    expect(topicMasteryPct(progress, mockQuestions, 'reglas')).toBe(100)
  })
})

// ─── passProbabilityPct ──────────────────────────────────────────────────────

describe('passProbabilityPct', () => {
  it('returns 0 when no answers', () => {
    expect(passProbabilityPct(baseProgress, mockQuestions)).toBe(0)
  })

  it('returns 100 when all topics are 100%', () => {
    const progress: Progress = {
      ...baseProgress,
      studyAnswers: {
        // senales (4 q)
        q_ts_1: { selectedIndex: 0, correct: true },
        q_ts_2: { selectedIndex: 0, correct: true },
        q_rm_1: { selectedIndex: 1, correct: true },
        q_rm_2: { selectedIndex: 1, correct: true },
        // reglas (2 q)
        q_rw_1: { selectedIndex: 0, correct: true },
        q_sl_1: { selectedIndex: 0, correct: true },
        // seguridad (2 q)
        q_dui_1: { selectedIndex: 0, correct: true },
        q_gen_1: { selectedIndex: 0, correct: true },
        // especial (2 q)
        q_sz_1: { selectedIndex: 0, correct: true },
        q_sz_2: { selectedIndex: 0, correct: true },
      },
    }
    expect(passProbabilityPct(progress, mockQuestions)).toBe(100)
  })

  it('returns arithmetic mean of all 4 topic mastery values', () => {
    // senales: 2/4 correct = 50%
    // reglas: 1/2 correct = 50%
    // seguridad: 0/2 correct = 0%
    // especial: 1/2 correct = 50%
    // mean = (50 + 50 + 0 + 50) / 4 = 37.5 → rounds to 38
    const progress: Progress = {
      ...baseProgress,
      studyAnswers: {
        q_ts_1: { selectedIndex: 0, correct: true },
        q_ts_2: { selectedIndex: 1, correct: false },
        q_rm_1: { selectedIndex: 1, correct: true },
        q_rm_2: { selectedIndex: 0, correct: false },
        q_rw_1: { selectedIndex: 0, correct: true },
        q_sl_1: { selectedIndex: 1, correct: false },
        q_sz_1: { selectedIndex: 0, correct: true },
        q_sz_2: { selectedIndex: 1, correct: false },
      },
    }
    expect(passProbabilityPct(progress, mockQuestions)).toBe(38)
  })
})

// ─── masteredKeywordsCount ───────────────────────────────────────────────────

describe('masteredKeywordsCount', () => {
  it('returns 0 when no mastered keywords', () => {
    expect(masteredKeywordsCount(baseProgress)).toBe(0)
  })

  it('returns count from masteredKeywords list', () => {
    const progress: Progress = {
      ...baseProgress,
      masteredKeywords: ['stop sign', 'yield', 'DUI'],
    }
    expect(masteredKeywordsCount(progress)).toBe(3)
  })

  it('counts masteredKeywords regardless of studyAnswersWithoutHints', () => {
    // masteredKeywords is the canonical list maintained at answer time.
    // masteredKeywordsCount simply returns its length.
    const progress: Progress = {
      ...baseProgress,
      masteredKeywords: ['stop sign'],
      studyAnswersWithoutHints: [],
    }
    expect(masteredKeywordsCount(progress)).toBe(1)
  })
})

// ─── shouldShowReadyChip ─────────────────────────────────────────────────────

describe('shouldShowReadyChip', () => {
  it('returns false when fewer than 3 daily readiness entries', () => {
    const progress: Progress = {
      ...baseProgress,
      dailyReadiness: [
        { date: '2026-05-06', readinessPct: 85 },
        { date: '2026-05-07', readinessPct: 90 },
      ],
    }
    expect(shouldShowReadyChip(progress)).toBe(false)
  })

  it('returns true when last 3 entries are all ≥ 80%', () => {
    const progress: Progress = {
      ...baseProgress,
      dailyReadiness: [
        { date: '2026-05-06', readinessPct: 80 },
        { date: '2026-05-07', readinessPct: 85 },
        { date: '2026-05-08', readinessPct: 90 },
      ],
    }
    expect(shouldShowReadyChip(progress)).toBe(true)
  })

  it('returns false when one of the last 3 dips below 80%', () => {
    const progress: Progress = {
      ...baseProgress,
      dailyReadiness: [
        { date: '2026-05-06', readinessPct: 90 },
        { date: '2026-05-07', readinessPct: 79 },
        { date: '2026-05-08', readinessPct: 85 },
      ],
    }
    expect(shouldShowReadyChip(progress)).toBe(false)
  })

  it('returns false when all 3 are exactly 79%', () => {
    const progress: Progress = {
      ...baseProgress,
      dailyReadiness: [
        { date: '2026-05-06', readinessPct: 79 },
        { date: '2026-05-07', readinessPct: 79 },
        { date: '2026-05-08', readinessPct: 79 },
      ],
    }
    expect(shouldShowReadyChip(progress)).toBe(false)
  })

  it('returns true even with more than 3 entries if last 3 are ≥ 80%', () => {
    const progress: Progress = {
      ...baseProgress,
      dailyReadiness: [
        { date: '2026-05-04', readinessPct: 20 }, // old low — should not matter
        { date: '2026-05-05', readinessPct: 30 },
        { date: '2026-05-06', readinessPct: 80 },
        { date: '2026-05-07', readinessPct: 82 },
        { date: '2026-05-08', readinessPct: 88 },
      ],
    }
    expect(shouldShowReadyChip(progress)).toBe(true)
  })

  it('returns false when exactly 0 entries', () => {
    expect(shouldShowReadyChip(baseProgress)).toBe(false)
  })
})

// ─── getRecentMockScores ─────────────────────────────────────────────────────

describe('getRecentMockScores', () => {
  const records = [
    { id: '2026-05-01T10:00:00', scoreCorrect: 35, scoreTotal: 50, takenAt: '2026-05-01' },
    { id: '2026-05-03T10:00:00', scoreCorrect: 40, scoreTotal: 50, takenAt: '2026-05-03' },
    { id: '2026-05-05T10:00:00', scoreCorrect: 42, scoreTotal: 50, takenAt: '2026-05-05' },
    { id: '2026-05-07T10:00:00', scoreCorrect: 45, scoreTotal: 50, takenAt: '2026-05-07' },
    { id: '2026-05-08T10:00:00', scoreCorrect: 47, scoreTotal: 50, takenAt: '2026-05-08' },
  ]

  it('returns empty array when no mock history', () => {
    expect(getRecentMockScores(baseProgress, 2)).toEqual([])
  })

  it('returns last n=1 record', () => {
    const progress: Progress = { ...baseProgress, mockHistory: records }
    const result = getRecentMockScores(progress, 1)
    expect(result).toHaveLength(1)
    expect(result[0].scoreCorrect).toBe(47)
  })

  it('returns last n=2 records, newest last', () => {
    const progress: Progress = { ...baseProgress, mockHistory: records }
    const result = getRecentMockScores(progress, 2)
    expect(result).toHaveLength(2)
    expect(result[0].scoreCorrect).toBe(45)
    expect(result[1].scoreCorrect).toBe(47)
  })

  it('returns all records when n exceeds history length', () => {
    const progress: Progress = { ...baseProgress, mockHistory: records.slice(0, 1) }
    const result = getRecentMockScores(progress, 5)
    expect(result).toHaveLength(1)
  })

  it('returns empty array when n=0', () => {
    const progress: Progress = { ...baseProgress, mockHistory: records }
    expect(getRecentMockScores(progress, 0)).toEqual([])
  })
})

// ─── incrementStreak ─────────────────────────────────────────────────────────

describe('incrementStreak', () => {
  it('sets streak to 1 on first completion (no prior date)', () => {
    const result = incrementStreak(baseProgress, '2026-05-08')
    expect(result.dailyQuiz.streakDays).toBe(1)
    expect(result.dailyQuiz.lastCompletedDate).toBe('2026-05-08')
  })

  it('is idempotent — same day does not increment', () => {
    const progress: Progress = {
      ...baseProgress,
      dailyQuiz: { streakDays: 3, lastCompletedDate: '2026-05-08' },
    }
    const result = incrementStreak(progress, '2026-05-08')
    expect(result.dailyQuiz.streakDays).toBe(3)
  })

  it('increments by 1 when next calendar day', () => {
    const progress: Progress = {
      ...baseProgress,
      dailyQuiz: { streakDays: 3, lastCompletedDate: '2026-05-07' },
    }
    const result = incrementStreak(progress, '2026-05-08')
    expect(result.dailyQuiz.streakDays).toBe(4)
    expect(result.dailyQuiz.lastCompletedDate).toBe('2026-05-08')
  })

  it('resets to 1 when gap is 2 days', () => {
    const progress: Progress = {
      ...baseProgress,
      dailyQuiz: { streakDays: 5, lastCompletedDate: '2026-05-06' },
    }
    const result = incrementStreak(progress, '2026-05-08')
    expect(result.dailyQuiz.streakDays).toBe(1)
  })

  it('resets to 1 when gap is more than 2 days', () => {
    const progress: Progress = {
      ...baseProgress,
      dailyQuiz: { streakDays: 10, lastCompletedDate: '2026-05-01' },
    }
    const result = incrementStreak(progress, '2026-05-08')
    expect(result.dailyQuiz.streakDays).toBe(1)
  })
})

// ─── isStreakActive ──────────────────────────────────────────────────────────

describe('isStreakActive', () => {
  it('returns false when no completion date', () => {
    expect(isStreakActive(baseProgress, '2026-05-08')).toBe(false)
  })

  it('returns true when completed today', () => {
    const progress: Progress = {
      ...baseProgress,
      dailyQuiz: { streakDays: 3, lastCompletedDate: '2026-05-08' },
    }
    expect(isStreakActive(progress, '2026-05-08')).toBe(true)
  })

  it('returns true when completed yesterday', () => {
    const progress: Progress = {
      ...baseProgress,
      dailyQuiz: { streakDays: 3, lastCompletedDate: '2026-05-07' },
    }
    expect(isStreakActive(progress, '2026-05-08')).toBe(true)
  })

  it('returns false when completed 2+ days ago', () => {
    const progress: Progress = {
      ...baseProgress,
      dailyQuiz: { streakDays: 3, lastCompletedDate: '2026-05-06' },
    }
    expect(isStreakActive(progress, '2026-05-08')).toBe(false)
  })
})

// ─── recordDailyReadiness ────────────────────────────────────────────────────

describe('recordDailyReadiness', () => {
  it('appends a new entry when dailyReadiness is empty', () => {
    const result = recordDailyReadiness(baseProgress, mockQuestions)
    expect(result.dailyReadiness).toHaveLength(1)
    expect(result.dailyReadiness[0].readinessPct).toBeDefined()
  })

  it('replaces todays entry if it already exists', () => {
    // Use pushDailyReadiness (via recordDailyReadiness) indirectly
    // by pre-seeding with a matching date
    // We can't easily set "today" in a unit test without mocking Intl,
    // so we test that calling it twice yields length 1 (replace) not length 2 (append).
    const first = recordDailyReadiness(baseProgress, mockQuestions)
    expect(first.dailyReadiness).toHaveLength(1)
    const second = recordDailyReadiness(first, mockQuestions)
    // Same day → still length 1
    expect(second.dailyReadiness).toHaveLength(1)
  })

  it('trims dailyReadiness to 30 entries', () => {
    // Pre-seed with 30 entries from different historical dates
    const historicalEntries = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-04-${String(i + 1).padStart(2, '0')}`,
      readinessPct: 50,
    }))
    const progress: Progress = {
      ...baseProgress,
      dailyReadiness: historicalEntries,
    }
    const result = recordDailyReadiness(progress, mockQuestions)
    // Today's entry (May 8) is different from April dates → appends then trims to 30
    expect(result.dailyReadiness.length).toBeLessThanOrEqual(30)
  })
})
