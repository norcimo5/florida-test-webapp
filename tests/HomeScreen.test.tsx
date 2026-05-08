import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import HomeScreen from '../src/components/HomeScreen'
import type { Progress, AppSettings } from '../src/types'

const defaultProgress: Progress = {
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

const defaultSettings: AppSettings = { examLength: 50, userName: 'TESTUSER', onboardingComplete: true }

describe('HomeScreen', () => {
  it('renders the app title', () => {
    render(
      <HomeScreen
        progress={defaultProgress}
        settings={defaultSettings}
        totalQuestions={5}
        onNavigate={vi.fn()}
        onOpenOptions={vi.fn()}
      />
    )
    expect(screen.getByText(/Prepárate para tu Examen/i)).toBeInTheDocument()
  })

  it('shows correct/incorrect/unanswered counts', () => {
    const progress: Progress = {
      ...defaultProgress,
      studyAnswers: {
        'q_0001': { selectedIndex: 2, correct: true },
        'q_0002': { selectedIndex: 0, correct: false },
      },
    }
    render(
      <HomeScreen
        progress={progress}
        settings={defaultSettings}
        totalQuestions={5}
        onNavigate={vi.fn()}
        onOpenOptions={vi.fn()}
      />
    )
    // 1 correct, 1 incorrect, 3 unanswered
    const allNums = screen.getAllByText(/^[0-9]+$/)
    const numTexts = allNums.map(el => el.textContent)
    expect(numTexts).toContain('1') // incorrect
    expect(numTexts).toContain('3') // unanswered
  })

  it('calls onNavigate with "study" when Modo Estudio is clicked', async () => {
    const onNavigate = vi.fn()
    render(
      <HomeScreen
        progress={defaultProgress}
        settings={defaultSettings}
        totalQuestions={5}
        onNavigate={onNavigate}
        onOpenOptions={vi.fn()}
      />
    )
    await userEvent.click(screen.getByText(/Modo Estudio/i))
    expect(onNavigate).toHaveBeenCalledWith('study')
  })

  it('calls onNavigate with "exam" when Examen Simulado is clicked', async () => {
    const onNavigate = vi.fn()
    render(
      <HomeScreen
        progress={defaultProgress}
        settings={defaultSettings}
        totalQuestions={5}
        onNavigate={onNavigate}
        onOpenOptions={vi.fn()}
      />
    )
    await userEvent.click(screen.getByText(/Examen Simulado/i))
    expect(onNavigate).toHaveBeenCalledWith('exam')
  })

  it('shows review missed button when there are incorrect answers', () => {
    const progress: Progress = {
      ...defaultProgress,
      studyAnswers: {
        'q_0001': { selectedIndex: 0, correct: false },
      },
    }
    render(
      <HomeScreen
        progress={progress}
        settings={defaultSettings}
        totalQuestions={5}
        onNavigate={vi.fn()}
        onOpenOptions={vi.fn()}
      />
    )
    expect(screen.getByText(/Repasar preguntas incorrectas/i)).toBeInTheDocument()
  })

  it('does not show review missed button when no incorrect answers', () => {
    render(
      <HomeScreen
        progress={defaultProgress}
        settings={defaultSettings}
        totalQuestions={5}
        onNavigate={vi.fn()}
        onOpenOptions={vi.fn()}
      />
    )
    expect(screen.queryByText(/Repasar preguntas incorrectas/i)).not.toBeInTheDocument()
  })
})
