import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ResultsScreen from '../src/components/ResultsScreen'
import type { Question, Progress } from '../src/types'

const questions: Question[] = [
  {
    id: 'q_001',
    en: { question: 'Q1', choices: ['A', 'B', 'C', 'D'], correct: 2 },
    es: null,
    keywords: [],
    category: 'traffic-signals',
    source: 'seed',
  },
  {
    id: 'q_002',
    en: { question: 'Q2', choices: ['A', 'B', 'C', 'D'], correct: 1 },
    es: null,
    keywords: [],
    category: 'school-zones',
    source: 'seed',
  },
]

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

describe('ResultsScreen', () => {
  it('shows score X out of N', () => {
    const progress: Progress = {
      ...baseProgress,
      examQuestionIds: ['q_001', 'q_002'],
      examAnswers: [
        { questionId: 'q_001', selectedIndex: 2 }, // correct
        { questionId: 'q_002', selectedIndex: 0 }, // wrong
      ],
      examComplete: true,
    }
    render(
      <ResultsScreen
        questions={questions}
        progress={progress}
        onRetry={vi.fn()}
        onStudy={vi.fn()}
        onBack={vi.fn()}
      />
    )
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument()
  })

  it('shows APROBADO when score >= 80%', () => {
    const progress: Progress = {
      ...baseProgress,
      examQuestionIds: ['q_001', 'q_002'],
      examAnswers: [
        { questionId: 'q_001', selectedIndex: 2 }, // correct
        { questionId: 'q_002', selectedIndex: 1 }, // correct
      ],
      examComplete: true,
    }
    render(
      <ResultsScreen
        questions={questions}
        progress={progress}
        onRetry={vi.fn()}
        onStudy={vi.fn()}
        onBack={vi.fn()}
      />
    )
    expect(screen.getByText(/APROBADO/i)).toBeInTheDocument()
  })

  it('shows REPROBADO when score < 80%', () => {
    const progress: Progress = {
      ...baseProgress,
      examQuestionIds: ['q_001', 'q_002'],
      examAnswers: [
        { questionId: 'q_001', selectedIndex: 0 }, // wrong
        { questionId: 'q_002', selectedIndex: 0 }, // wrong
      ],
      examComplete: true,
    }
    render(
      <ResultsScreen
        questions={questions}
        progress={progress}
        onRetry={vi.fn()}
        onStudy={vi.fn()}
        onBack={vi.fn()}
      />
    )
    expect(screen.getByText(/REPROBADO/i)).toBeInTheDocument()
  })

  it('calls onRetry when retry button clicked', async () => {
    const onRetry = vi.fn()
    const progress: Progress = {
      ...baseProgress,
      examQuestionIds: ['q_001'],
      examAnswers: [{ questionId: 'q_001', selectedIndex: 0 }],
      examComplete: true,
    }
    render(
      <ResultsScreen
        questions={questions}
        progress={progress}
        onRetry={onRetry}
        onStudy={vi.fn()}
        onBack={vi.fn()}
      />
    )
    await userEvent.click(screen.getByText(/Intentar de nuevo/i))
    expect(onRetry).toHaveBeenCalled()
  })
})
