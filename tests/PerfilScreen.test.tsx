import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PerfilScreen } from '../src/components/PerfilScreen'
import type { Progress, AppSettings, Question } from '../src/types'

// ── Fixtures ─────────────────────────────────────────────────────────────────

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

const defaultSettings: AppSettings = {
  examLength: 50,
  userName: 'TESTUSER',
  onboardingComplete: true,
}

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
    category: 'dui',
    source: 'test',
  },
]

// Helper: progress with some study answers
function makeProgress(overrides: Partial<Progress> = {}): Progress {
  return { ...emptyProgress, ...overrides }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PerfilScreen', () => {
  it('renders the strip header with title "Perfil"', () => {
    render(
      <PerfilScreen
        questions={questions}
        progress={emptyProgress}
        settings={defaultSettings}
        onNavigateToAjustes={() => {}}
      />,
    )
    expect(screen.getByRole('banner')).toBeTruthy()
    expect(screen.getByText('Perfil')).toBeTruthy()
  })

  it('renders the userName from settings', () => {
    render(
      <PerfilScreen
        questions={questions}
        progress={emptyProgress}
        settings={{ ...defaultSettings, userName: 'María' }}
        onNavigateToAjustes={() => {}}
      />,
    )
    expect(screen.getByText('María')).toBeTruthy()
  })

  it('renders the avatar with the first letter of userName', () => {
    render(
      <PerfilScreen
        questions={questions}
        progress={emptyProgress}
        settings={{ ...defaultSettings, userName: 'Carlos' }}
        onNavigateToAjustes={() => {}}
      />,
    )
    // Avatar renders the first letter uppercase
    expect(screen.getByText('C')).toBeTruthy()
  })

  it('shows "Preguntas respondidas" stat row', () => {
    render(
      <PerfilScreen
        questions={questions}
        progress={emptyProgress}
        settings={defaultSettings}
        onNavigateToAjustes={() => {}}
      />,
    )
    expect(screen.getByText('Preguntas respondidas')).toBeTruthy()
  })

  it('shows correct count for Preguntas respondidas', () => {
    const progressWith2Answers = makeProgress({
      studyAnswers: {
        q1: { selectedIndex: 0, correct: true },
        q2: { selectedIndex: 1, correct: false },
      },
    })
    render(
      <PerfilScreen
        questions={questions}
        progress={progressWith2Answers}
        settings={defaultSettings}
        onNavigateToAjustes={() => {}}
      />,
    )
    expect(screen.getByText('Preguntas respondidas')).toBeTruthy()
    // 2 answers → value "2"
    expect(screen.getByText('2')).toBeTruthy()
  })

  it('shows "Racha actual" stat row', () => {
    render(
      <PerfilScreen
        questions={questions}
        progress={emptyProgress}
        settings={defaultSettings}
        onNavigateToAjustes={() => {}}
      />,
    )
    expect(screen.getByText('Racha actual')).toBeTruthy()
  })

  it('shows correct streak value', () => {
    const progressWith3Streak = makeProgress({
      dailyQuiz: { streakDays: 3, lastCompletedDate: '2026-05-08' },
    })
    render(
      <PerfilScreen
        questions={questions}
        progress={progressWith3Streak}
        settings={defaultSettings}
        onNavigateToAjustes={() => {}}
      />,
    )
    expect(screen.getByText('3 días')).toBeTruthy()
  })

  it('shows "1 día" (singular) when streak is 1', () => {
    const progressWith1Streak = makeProgress({
      dailyQuiz: { streakDays: 1, lastCompletedDate: '2026-05-08' },
    })
    render(
      <PerfilScreen
        questions={questions}
        progress={progressWith1Streak}
        settings={defaultSettings}
        onNavigateToAjustes={() => {}}
      />,
    )
    expect(screen.getByText('1 día')).toBeTruthy()
  })

  it('shows "Probabilidad de aprobar" stat row', () => {
    render(
      <PerfilScreen
        questions={questions}
        progress={emptyProgress}
        settings={defaultSettings}
        onNavigateToAjustes={() => {}}
      />,
    )
    expect(screen.getByText('Probabilidad de aprobar')).toBeTruthy()
  })

  it('shows "Palabras dominadas" stat row', () => {
    render(
      <PerfilScreen
        questions={questions}
        progress={emptyProgress}
        settings={defaultSettings}
        onNavigateToAjustes={() => {}}
      />,
    )
    expect(screen.getByText('Palabras dominadas')).toBeTruthy()
  })

  it('shows correct palabras dominadas count', () => {
    const progressWithKeywords = makeProgress({
      masteredKeywords: ['stop', 'yield', 'speed'],
    })
    render(
      <PerfilScreen
        questions={questions}
        progress={progressWithKeywords}
        settings={defaultSettings}
        onNavigateToAjustes={() => {}}
      />,
    )
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('renders the "Ver ajustes →" footer link', () => {
    render(
      <PerfilScreen
        questions={questions}
        progress={emptyProgress}
        settings={defaultSettings}
        onNavigateToAjustes={() => {}}
      />,
    )
    expect(screen.getByText('Ver ajustes →')).toBeTruthy()
  })

  it('calls onNavigateToAjustes when "Ver ajustes →" is clicked', async () => {
    const user = userEvent.setup()
    const onNavigateToAjustes = vi.fn()
    render(
      <PerfilScreen
        questions={questions}
        progress={emptyProgress}
        settings={defaultSettings}
        onNavigateToAjustes={onNavigateToAjustes}
      />,
    )
    await user.click(screen.getByText('Ver ajustes →'))
    expect(onNavigateToAjustes).toHaveBeenCalledOnce()
  })

  it('does NOT render any reset/destructive button on this screen', () => {
    render(
      <PerfilScreen
        questions={questions}
        progress={emptyProgress}
        settings={defaultSettings}
        onNavigateToAjustes={() => {}}
      />,
    )
    // The only button on this screen is the "Ver ajustes →" link
    const buttons = screen.getAllByRole('button')
    for (const btn of buttons) {
      const text = btn.textContent ?? ''
      expect(text.toLowerCase()).not.toContain('reiniciar')
      expect(text.toLowerCase()).not.toContain('eliminar')
      expect(text.toLowerCase()).not.toContain('borrar')
    }
  })

  it('shows "0%" probability when no questions answered', () => {
    render(
      <PerfilScreen
        questions={questions}
        progress={emptyProgress}
        settings={defaultSettings}
        onNavigateToAjustes={() => {}}
      />,
    )
    expect(screen.getByText('0%')).toBeTruthy()
  })
})
