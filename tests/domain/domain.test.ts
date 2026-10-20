/**
 * Domain logic tests — ported 1:1 from the Android app's MetricsTest.kt, plus date helpers.
 */
import { describe, expect, it } from 'vitest'
import { countForDay, dailyQuizAllowed, freeLeftToday, fullMockAllowed, studyAllowed } from '../../src/domain/gating'
import { macroTopicOf, isMacroTopic } from '../../src/domain/macroTopic'
import { passProbabilityPct, passed, scorePct, topicMasteryPct } from '../../src/domain/metrics'
import {
  addDays,
  dayKey,
  dayNumber,
  effectiveDay,
  formatDayEs,
  fromDayNumber,
  msUntilNextLocalMidnight,
} from '../../src/domain/dates'
import type { Question } from '../../src/domain/types'
import { QUESTIONS, sampleExam } from '../../src/data/questions'

const q = (id: string, category: Question['category']): Question => ({
  id,
  en: { question: '?', choices: ['a', 'b'], correct: 0 },
  es: null,
  keywords: [],
  category,
  source: '',
})

const bank = [
  q('a', 'traffic-signals'), q('b', 'road-markings'), // SENALES x2
  q('c', 'right-of-way'), q('d', 'speed-limits'),     // REGLAS x2
  q('e', 'dui'), q('f', 'general'),                   // SEGURIDAD x2
  q('g', 'school-zones'),                             // ESPECIAL x1
]

describe('metrics', () => {
  it('empty topic mastery is zero', () => {
    expect(topicMasteryPct({}, bank, 'SENALES')).toBe(0)
  })
  it('full topic mastery is 100', () => {
    expect(topicMasteryPct({ a: true, b: true }, bank, 'SENALES')).toBe(100)
  })
  it('a wrong latest answer does not count as mastered', () => {
    expect(topicMasteryPct({ a: true, b: false }, bank, 'SENALES')).toBe(50)
  })
  it('pass probability is the mean of the four topics', () => {
    expect(passProbabilityPct({ a: true, b: true }, bank)).toBe(25)
  })
  it('scores round half up and pass at 80%', () => {
    expect(scorePct(40, 50)).toBe(80)
    expect(passed(40, 50)).toBe(true)
    expect(passed(39, 50)).toBe(false)
    expect(scorePct(1, 3)).toBe(33)
    expect(scorePct(0, 0)).toBe(0)
  })
})

describe('gating (free tier)', () => {
  it('blocks study after five a day for free users only', () => {
    expect(studyAllowed(false, 4)).toBe(true)
    expect(studyAllowed(false, 5)).toBe(false)
    expect(studyAllowed(true, 99)).toBe(true)
    expect(freeLeftToday(2)).toBe(3)
    expect(freeLeftToday(9)).toBe(0)
  })
  it('daily count resets when the day changes', () => {
    expect(countForDay('2026-06-12', 5, '2026-06-12')).toBe(5)
    expect(countForDay('2026-06-12', 5, '2026-06-13')).toBe(0)
    expect(countForDay(null, 7, '2026-06-13')).toBe(0)
  })
  it('allows one daily quiz per day for free users', () => {
    expect(dailyQuizAllowed(false, null, '2026-06-12')).toBe(true)
    expect(dailyQuizAllowed(false, '2026-06-11', '2026-06-12')).toBe(true)
    expect(dailyQuizAllowed(false, '2026-06-12', '2026-06-12')).toBe(false)
    expect(dailyQuizAllowed(true, '2026-06-12', '2026-06-12')).toBe(true)
  })
  it('full mock is premium only', () => {
    expect(fullMockAllowed(false)).toBe(false)
    expect(fullMockAllowed(true)).toBe(true)
  })
})

describe('macro topics', () => {
  it('maps categories and falls back to SEGURIDAD', () => {
    expect(macroTopicOf('road-markings')).toBe('SENALES')
    expect(macroTopicOf('speed-limits')).toBe('REGLAS')
    expect(macroTopicOf('school-zones')).toBe('ESPECIAL')
    expect(macroTopicOf('something-new')).toBe('SEGURIDAD')
    expect(isMacroTopic('REGLAS')).toBe(true)
    expect(isMacroTopic('nope')).toBe(false)
  })
})

describe('dates', () => {
  it('round-trips day numbers and adds days across months', () => {
    expect(fromDayNumber(dayNumber('2026-10-20'))).toBe('2026-10-20')
    expect(addDays('2026-10-20', 30)).toBe('2026-11-19')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(formatDayEs('2026-11-19')).toBe('19 de noviembre de 2026')
    expect(() => dayNumber('bad')).toThrow()
  })

  it('ignores the phone clock going backwards (within ~2 months)', () => {
    expect(effectiveDay('2026-10-20', null)).toBe('2026-10-20')
    expect(effectiveDay('2026-10-20', '2026-10-10')).toBe('2026-10-20')
    expect(effectiveDay('2026-09-20', '2026-10-20')).toBe('2026-10-20') // date set back a month
    expect(effectiveDay('2026-01-01', '2026-10-20')).toBe('2026-01-01') // stale far-future value ignored
  })

  it('schedules the midnight refresh just after local midnight', () => {
    const ms = msUntilNextLocalMidnight(new Date(2026, 9, 20, 23, 59, 0))
    expect(ms).toBe(61_000)
  })
})

describe('question bank', () => {
  it('has 120 well-formed questions with all four topics present', () => {
    expect(QUESTIONS).toHaveLength(120)
    for (const item of QUESTIONS) {
      expect(item.en.choices[item.en.correct]).toBeDefined()
    }
    const topics = new Set(QUESTIONS.map((x) => macroTopicOf(x.category)))
    expect(topics.size).toBe(4)
  })
  it('samples unique questions', () => {
    const exam = sampleExam(50)
    expect(exam).toHaveLength(50)
    expect(new Set(exam.map((x) => x.id)).size).toBe(50)
  })
})
