import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TemasScreen } from '../src/components/TemasScreen'
import type { MacroTopic, Progress, Question } from '../src/types'
import { MACRO_TOPIC_LABELS } from '../src/store/computed'

// Minimal progress with empty answers
const emptyProgress: Progress = {
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

// One question per topic so mastery can be computed
const questions: Question[] = [
  {
    id: 'q1',
    en: { question: 'Q1', choices: ['A', 'B'], correct: 0 },
    es: null,
    keywords: [],
    category: 'traffic-signals',
    source: 'test',
  },
  {
    id: 'q2',
    en: { question: 'Q2', choices: ['A', 'B'], correct: 0 },
    es: null,
    keywords: [],
    category: 'right-of-way',
    source: 'test',
  },
  {
    id: 'q3',
    en: { question: 'Q3', choices: ['A', 'B'], correct: 0 },
    es: null,
    keywords: [],
    category: 'dui',
    source: 'test',
  },
  {
    id: 'q4',
    en: { question: 'Q4', choices: ['A', 'B'], correct: 0 },
    es: null,
    keywords: [],
    category: 'school-zones',
    source: 'test',
  },
]

describe('TemasScreen', () => {
  it('renders all 4 macro-topic cards', () => {
    render(
      <TemasScreen
        questions={questions}
        progress={emptyProgress}
        onTopicTap={() => {}}
      />,
    )
    const allTopics: MacroTopic[] = ['senales', 'reglas', 'seguridad', 'especial']
    for (const topic of allTopics) {
      expect(screen.getByText(MACRO_TOPIC_LABELS[topic])).toBeTruthy()
    }
  })

  it('renders exactly 4 topic card buttons', () => {
    render(
      <TemasScreen
        questions={questions}
        progress={emptyProgress}
        onTopicTap={() => {}}
      />,
    )
    // Each TopicCard is a <button>
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
  })

  it('calls onTopicTap with "senales" when Señales card is tapped', async () => {
    const user = userEvent.setup()
    const onTopicTap = vi.fn()
    render(
      <TemasScreen
        questions={questions}
        progress={emptyProgress}
        onTopicTap={onTopicTap}
      />,
    )
    await user.click(screen.getByText(MACRO_TOPIC_LABELS['senales']))
    expect(onTopicTap).toHaveBeenCalledWith('senales')
  })

  it('calls onTopicTap with "reglas" when Reglas card is tapped', async () => {
    const user = userEvent.setup()
    const onTopicTap = vi.fn()
    render(
      <TemasScreen
        questions={questions}
        progress={emptyProgress}
        onTopicTap={onTopicTap}
      />,
    )
    await user.click(screen.getByText(MACRO_TOPIC_LABELS['reglas']))
    expect(onTopicTap).toHaveBeenCalledWith('reglas')
  })

  it('calls onTopicTap with "seguridad" when Seguridad card is tapped', async () => {
    const user = userEvent.setup()
    const onTopicTap = vi.fn()
    render(
      <TemasScreen
        questions={questions}
        progress={emptyProgress}
        onTopicTap={onTopicTap}
      />,
    )
    await user.click(screen.getByText(MACRO_TOPIC_LABELS['seguridad']))
    expect(onTopicTap).toHaveBeenCalledWith('seguridad')
  })

  it('calls onTopicTap with "especial" when Especial card is tapped', async () => {
    const user = userEvent.setup()
    const onTopicTap = vi.fn()
    render(
      <TemasScreen
        questions={questions}
        progress={emptyProgress}
        onTopicTap={onTopicTap}
      />,
    )
    await user.click(screen.getByText(MACRO_TOPIC_LABELS['especial']))
    expect(onTopicTap).toHaveBeenCalledWith('especial')
  })

  it('renders the strip header with title "Temas"', () => {
    render(
      <TemasScreen
        questions={questions}
        progress={emptyProgress}
        onTopicTap={() => {}}
      />,
    )
    expect(screen.getByRole('banner')).toBeTruthy()
    expect(screen.getByText('Temas')).toBeTruthy()
  })

  it('each card fires its own callback — not a shared one', async () => {
    const user = userEvent.setup()
    const onTopicTap = vi.fn()
    render(
      <TemasScreen
        questions={questions}
        progress={emptyProgress}
        onTopicTap={onTopicTap}
      />,
    )
    const allTopics: MacroTopic[] = ['senales', 'reglas', 'seguridad', 'especial']
    for (const topic of allTopics) {
      await user.click(screen.getByText(MACRO_TOPIC_LABELS[topic]))
    }
    expect(onTopicTap).toHaveBeenCalledTimes(4)
    expect(onTopicTap).toHaveBeenNthCalledWith(1, 'senales')
    expect(onTopicTap).toHaveBeenNthCalledWith(2, 'reglas')
    expect(onTopicTap).toHaveBeenNthCalledWith(3, 'seguridad')
    expect(onTopicTap).toHaveBeenNthCalledWith(4, 'especial')
  })
})
