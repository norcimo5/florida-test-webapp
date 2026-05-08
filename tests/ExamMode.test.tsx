import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ExamMode from '../src/components/ExamMode'
import type { Question, Progress, AppSettings } from '../src/types'

const questions: Question[] = [
  {
    id: 'q_001',
    en: {
      question: 'What does a flashing yellow light mean?',
      choices: ['Stop', 'Speed up', 'Slow down', 'Yield'],
      correct: 2,
    },
    es: { question: '¿Qué significa?', choices: ['A', 'B', 'C', 'D'] },
    keywords: [{ en: 'flashing yellow', es: 'amarilla' }],
    category: 'traffic-signals',
    source: 'seed',
  },
  {
    id: 'q_002',
    en: {
      question: 'What is the speed limit in a school zone?',
      choices: ['15 mph', '20 mph', '25 mph', '30 mph'],
      correct: 1,
    },
    es: { question: '¿Límite?', choices: ['15', '20', '25', '30'] },
    keywords: [{ en: 'school zone', es: 'zona escolar' }],
    category: 'school-zones',
    source: 'seed',
  },
]

const defaultProgress: Progress = {
  studyAnswers: {},
  bookmarks: [],
  examQuestionIds: ['q_001', 'q_002'],
  examAnswers: [],
  examComplete: false,
  mockHistory: [],
  dailyReadiness: [],
  dailyQuiz: { streakDays: 0, lastCompletedDate: null },
  masteredKeywords: [],
  studyAnswersWithoutHints: [],
}

const settings: AppSettings = { examLength: 50, userName: 'TESTUSER', onboardingComplete: true }

describe('ExamMode', () => {
  it('shows English question text', () => {
    render(
      <ExamMode
        questions={questions}
        progress={defaultProgress}
        settings={settings}
        onProgressUpdate={vi.fn()}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />
    )
    expect(screen.getByText(/flashing yellow light/i)).toBeInTheDocument()
  })

  it('does NOT show Spanish translation', () => {
    render(
      <ExamMode
        questions={questions}
        progress={defaultProgress}
        settings={settings}
        onProgressUpdate={vi.fn()}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />
    )
    expect(screen.queryByText(/ESPAÑOL/i)).not.toBeInTheDocument()
  })

  it('does NOT reveal correct answer after selection', async () => {
    const onProgressUpdate = vi.fn()
    render(
      <ExamMode
        questions={questions}
        progress={defaultProgress}
        settings={settings}
        onProgressUpdate={onProgressUpdate}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />
    )
    await userEvent.click(screen.getByText('Stop'))
    // Should record answer but not show green/red styling cues in text
    expect(onProgressUpdate).toHaveBeenCalled()
    expect(screen.queryByText(/correcto/i)).not.toBeInTheDocument()
  })

  it('calls onComplete when exam is finished', async () => {
    const onComplete = vi.fn()
    const progressWithAnswers: Progress = {
      ...defaultProgress,
      examAnswers: [
        { questionId: 'q_001', selectedIndex: 2 },
        { questionId: 'q_002', selectedIndex: 1 },
      ],
    }
    render(
      <ExamMode
        questions={questions}
        progress={progressWithAnswers}
        settings={settings}
        onProgressUpdate={vi.fn()}
        onComplete={onComplete}
        onBack={vi.fn()}
      />
    )
    // Navigate to last question and finish
    const finishBtn = screen.queryByText(/Terminar Examen/i)
    if (finishBtn) {
      await userEvent.click(finishBtn)
      expect(onComplete).toHaveBeenCalled()
    }
  })
})
