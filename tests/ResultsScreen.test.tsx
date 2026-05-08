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
        onProgressUpdate={vi.fn()}
        onStudy={vi.fn()}
        onBack={vi.fn()}
      />
    )
    // Score displayed as "1 / 2  =  50%"
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument()
  })

  it('shows ¡APROBASTE! when score >= 80%', () => {
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
        onProgressUpdate={vi.fn()}
        onStudy={vi.fn()}
        onBack={vi.fn()}
      />
    )
    expect(screen.getByText(/APROBASTE/i)).toBeInTheDocument()
  })

  it('shows Sigue practicando when score < 80%', () => {
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
        onProgressUpdate={vi.fn()}
        onStudy={vi.fn()}
        onBack={vi.fn()}
      />
    )
    expect(screen.getByText(/Sigue practicando/i)).toBeInTheDocument()
  })

  it('calls onStudy when Repasar Errores button clicked', async () => {
    const onStudy = vi.fn()
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
        onProgressUpdate={vi.fn()}
        onStudy={onStudy}
        onBack={vi.fn()}
      />
    )
    await userEvent.click(screen.getByText(/Repasar Errores/i))
    expect(onStudy).toHaveBeenCalled()
  })

  it('calls onBack when Volver al Inicio button clicked', async () => {
    const onBack = vi.fn()
    const progress: Progress = {
      ...baseProgress,
      examQuestionIds: ['q_001'],
      examAnswers: [{ questionId: 'q_001', selectedIndex: 2 }],
      examComplete: true,
    }
    render(
      <ResultsScreen
        questions={questions}
        progress={progress}
        onProgressUpdate={vi.fn()}
        onStudy={vi.fn()}
        onBack={onBack}
      />
    )
    // The back button in the header also calls onBack; we specifically want the CTA
    const backButtons = screen.getAllByText(/Volver al Inicio/i)
    await userEvent.click(backButtons[0])
    expect(onBack).toHaveBeenCalled()
  })

  it('calls onProgressUpdate with a mockHistory entry on mount', () => {
    const onProgressUpdate = vi.fn()
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
        onProgressUpdate={onProgressUpdate}
        onStudy={vi.fn()}
        onBack={vi.fn()}
      />
    )
    expect(onProgressUpdate).toHaveBeenCalledOnce()
    const updatedProgress = onProgressUpdate.mock.calls[0][0] as typeof progress
    expect(updatedProgress.mockHistory).toHaveLength(1)
    expect(updatedProgress.mockHistory[0].scoreCorrect).toBe(2)
    expect(updatedProgress.mockHistory[0].scoreTotal).toBe(2)
  })

  it('does not double-push mockHistory if latest entry already matches', () => {
    const onProgressUpdate = vi.fn()
    const now = new Date().toISOString()
    const progress: Progress = {
      ...baseProgress,
      examQuestionIds: ['q_001', 'q_002'],
      examAnswers: [
        { questionId: 'q_001', selectedIndex: 2 }, // correct
        { questionId: 'q_002', selectedIndex: 1 }, // correct
      ],
      examComplete: true,
      mockHistory: [
        { id: now, scoreCorrect: 2, scoreTotal: 2, takenAt: now },
      ],
    }
    render(
      <ResultsScreen
        questions={questions}
        progress={progress}
        onProgressUpdate={onProgressUpdate}
        onStudy={vi.fn()}
        onBack={vi.fn()}
      />
    )
    // Should NOT call onProgressUpdate because the latest record already matches
    expect(onProgressUpdate).not.toHaveBeenCalled()
  })

  it('shows DESEMPEÑO POR CATEGORÍA section', () => {
    const progress: Progress = {
      ...baseProgress,
      examQuestionIds: ['q_001', 'q_002'],
      examAnswers: [
        { questionId: 'q_001', selectedIndex: 2 },
        { questionId: 'q_002', selectedIndex: 1 },
      ],
      examComplete: true,
    }
    render(
      <ResultsScreen
        questions={questions}
        progress={progress}
        onProgressUpdate={vi.fn()}
        onStudy={vi.fn()}
        onBack={vi.fn()}
      />
    )
    expect(screen.getByText(/DESEMPEÑO POR CATEGORÍA/i)).toBeInTheDocument()
  })

  it('shows subtext about pass threshold', () => {
    const progress: Progress = {
      ...baseProgress,
      examQuestionIds: ['q_001'],
      examAnswers: [{ questionId: 'q_001', selectedIndex: 2 }],
      examComplete: true,
    }
    render(
      <ResultsScreen
        questions={questions}
        progress={progress}
        onProgressUpdate={vi.fn()}
        onStudy={vi.fn()}
        onBack={vi.fn()}
      />
    )
    expect(screen.getByText(/Necesitas 40 \/ 50 para aprobar/i)).toBeInTheDocument()
  })
})
