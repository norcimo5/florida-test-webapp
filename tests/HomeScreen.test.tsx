import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import HomeScreen from '../src/components/HomeScreen'
import type { Question, Progress, AppSettings, MacroTopic } from '../src/types'
import { MACRO_TOPIC_LABELS } from '../src/store/computed'

// ── Minimal question bank (1–2 questions per macro topic) ────────────────────

const mockQuestions: Question[] = [
  // senales — 2 questions
  {
    id: 'q_s1',
    en: {
      question: 'What does a red traffic light mean?',
      choices: ['Stop', 'Go', 'Yield', 'Slow down'],
      correct: 0,
    },
    es: { question: '¿Qué significa un semáforo rojo?', choices: ['Pare', 'Siga', 'Ceda', 'Reduzca'] },
    keywords: [{ en: 'red light', es: 'luz roja' }],
    category: 'traffic-signals',
    source: 'test',
  },
  {
    id: 'q_s2',
    en: {
      question: 'What does a yellow road marking indicate?',
      choices: ['Center line', 'Edge line', 'Turn lane', 'Parking'],
      correct: 0,
    },
    es: { question: '¿Qué indica una marca amarilla?', choices: ['Centro', 'Borde', 'Giro', 'Estacionar'] },
    keywords: [{ en: 'yellow marking', es: 'marca amarilla' }],
    category: 'road-markings',
    source: 'test',
  },
  // reglas — 1 question
  {
    id: 'q_r1',
    en: {
      question: 'Who has the right of way at a 4-way stop?',
      choices: ['First to arrive', 'Largest vehicle', 'Pedestrians only', 'None'],
      correct: 0,
    },
    es: { question: '¿Quién tiene la vía?', choices: ['Primero en llegar', 'Más grande', 'Solo peatones', 'Nadie'] },
    keywords: [{ en: 'right of way', es: 'derecho de vía' }],
    category: 'right-of-way',
    source: 'test',
  },
  // seguridad — 1 question
  {
    id: 'q_g1',
    en: {
      question: 'What is the legal BAC limit for drivers over 21?',
      choices: ['0.08', '0.10', '0.05', '0.00'],
      correct: 0,
    },
    es: { question: '¿Cuál es el límite legal de BAC?', choices: ['0.08', '0.10', '0.05', '0.00'] },
    keywords: [{ en: 'BAC', es: 'nivel de alcohol' }],
    category: 'dui',
    source: 'test',
  },
  // especial — 1 question
  {
    id: 'q_e1',
    en: {
      question: 'What speed limit applies in a school zone?',
      choices: ['15 mph', '20 mph', '25 mph', '30 mph'],
      correct: 1,
    },
    es: { question: '¿Cuál es el límite en zona escolar?', choices: ['15 mph', '20 mph', '25 mph', '30 mph'] },
    keywords: [{ en: 'school zone', es: 'zona escolar' }],
    category: 'school-zones',
    source: 'test',
  },
]

// ── Progress fixtures ─────────────────────────────────────────────────────────

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

const progressWithMocks: Progress = {
  ...emptyProgress,
  studyAnswers: {
    q_s1: { selectedIndex: 0, correct: true },
    q_s2: { selectedIndex: 0, correct: true },
    q_r1: { selectedIndex: 0, correct: true },
    q_g1: { selectedIndex: 0, correct: true },
    q_e1: { selectedIndex: 1, correct: true },
  },
  masteredKeywords: ['red light', 'yellow marking', 'right of way'],
  mockHistory: [
    { id: '2026-05-06T10:00:00Z', scoreCorrect: 44, scoreTotal: 50, takenAt: '2026-05-06' },
    { id: '2026-05-07T10:00:00Z', scoreCorrect: 45, scoreTotal: 50, takenAt: '2026-05-07' },
  ],
}

/** Progress that triggers the "Listo" ready chip (3 days ≥80% readiness) */
const progressForReadyChip: Progress = {
  ...emptyProgress,
  dailyReadiness: [
    { date: '2026-05-06', readinessPct: 85 },
    { date: '2026-05-07', readinessPct: 90 },
    { date: '2026-05-08', readinessPct: 82 },
  ],
}

const defaultSettings: AppSettings = {
  examLength: 50,
  userName: 'TESTUSER',
  onboardingComplete: true,
}

// ── Render helper ─────────────────────────────────────────────────────────────

interface RenderOpts {
  progress?: Progress
  settings?: AppSettings
  onTopicTap?: (topic: MacroTopic) => void
  onStartFullMock?: () => void
  onStartDailyQuiz?: () => void
}

function renderHome({
  progress = emptyProgress,
  settings = defaultSettings,
  onTopicTap = vi.fn(),
  onStartFullMock = vi.fn(),
  onStartDailyQuiz = vi.fn(),
}: RenderOpts = {}) {
  return render(
    <HomeScreen
      questions={mockQuestions}
      progress={progress}
      settings={settings}
      onTopicTap={onTopicTap}
      onStartFullMock={onStartFullMock}
      onStartDailyQuiz={onStartDailyQuiz}
    />,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HomeScreen', () => {
  // US-1: Spanish greeting
  it('renders Spanish greeting with userName', () => {
    renderHome()
    expect(screen.getByText('¡Hola, TESTUSER!')).toBeInTheDocument()
  })

  // US-4: 4 topic cards
  it('renders 4 topic cards with Spanish labels', () => {
    renderHome()
    for (const topic of Object.keys(MACRO_TOPIC_LABELS) as (keyof typeof MACRO_TOPIC_LABELS)[]) {
      expect(screen.getByText(MACRO_TOPIC_LABELS[topic])).toBeInTheDocument()
    }
  })

  // US-2: Pass probability percentage
  it('renders pass probability percentage figure', () => {
    // With all questions answered correctly, probability should be 100%
    renderHome({ progress: progressWithMocks })
    // The probability bar label and the sentence should both show the pct
    const allPct = screen.getAllByText(/100%/)
    expect(allPct.length).toBeGreaterThan(0)
  })

  // US-3: Vocab streak chip
  it('renders vocab streak chip with 🔥 and count', () => {
    renderHome({ progress: progressWithMocks })
    expect(screen.getByText(/🔥.*palabras dominadas/)).toBeInTheDocument()
  })

  it('renders 3 palabras dominadas when masteredKeywords has 3 items', () => {
    renderHome({ progress: progressWithMocks })
    expect(screen.getByText(/🔥 3 palabras dominadas/)).toBeInTheDocument()
  })

  // US-8: Performance chart SVG
  it('renders the performance chart svg', () => {
    const { container } = renderHome()
    // PerformanceChart renders its empty state as a div when readiness is empty
    // or an SVG when there are readiness entries
    expect(
      container.querySelector('svg') || container.querySelector('.perf-chart'),
    ).toBeTruthy()
  })

  it('renders performance chart svg when readiness data exists', () => {
    const { container } = renderHome({ progress: progressForReadyChip })
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  // US-8: "Listo" chip conditional rendering
  it('renders "Listo" chip when shouldShowReadyChip is true (3 days ≥80%)', () => {
    renderHome({ progress: progressForReadyChip })
    expect(screen.getByText(/Listo\/a para el examen real/)).toBeInTheDocument()
  })

  it('does NOT render "Listo" chip when condition is not met (< 3 days ≥80%)', () => {
    const notReady: Progress = {
      ...emptyProgress,
      dailyReadiness: [
        { date: '2026-05-07', readinessPct: 85 },
        { date: '2026-05-08', readinessPct: 90 },
        // only 2 entries → false
      ],
    }
    renderHome({ progress: notReady })
    expect(screen.queryByText(/Listo\/a para el examen real/)).not.toBeInTheDocument()
  })

  // US-15: Empty state microcopy (home__empty-hint specifically — PerformanceChart also renders same text)
  it('shows home empty-state hint when no study or mock progress', () => {
    const { container } = renderHome({ progress: emptyProgress })
    expect(container.querySelector('.home__empty-hint')).toBeInTheDocument()
  })

  it('does NOT show home empty-state hint when progress exists', () => {
    const progressWithReadiness: Progress = {
      ...progressWithMocks,
      dailyReadiness: [{ date: '2026-05-08', readinessPct: 100 }],
    }
    const { container } = renderHome({ progress: progressWithReadiness })
    expect(container.querySelector('.home__empty-hint')).not.toBeInTheDocument()
  })

  // US-7: Recent scores empty state
  it('shows "Sin exámenes aún" when no mock history', () => {
    renderHome({ progress: emptyProgress })
    expect(screen.getByText('Sin exámenes aún')).toBeInTheDocument()
  })

  it('does NOT show "Sin exámenes aún" when mock scores exist', () => {
    renderHome({ progress: progressWithMocks })
    expect(screen.queryByText('Sin exámenes aún')).not.toBeInTheDocument()
  })

  // CTA callbacks
  it('fires onTopicTap with the correct topic when a topic card is tapped', async () => {
    const user = userEvent.setup()
    const onTopicTap = vi.fn()
    renderHome({ onTopicTap })

    // Click the Señales de Tráfico card
    const senal = screen.getByText(MACRO_TOPIC_LABELS.senales)
    await user.click(senal.closest('button')!)
    expect(onTopicTap).toHaveBeenCalledWith('senales')
  })

  it('fires onStartFullMock when the full-mock CTA is tapped', async () => {
    const user = userEvent.setup()
    const onStartFullMock = vi.fn()
    renderHome({ onStartFullMock })
    await user.click(screen.getByText(/EMPEZAR EXAMEN COMPLETO/))
    expect(onStartFullMock).toHaveBeenCalledOnce()
  })

  it('fires onStartDailyQuiz when the daily quiz CTA is tapped', async () => {
    const user = userEvent.setup()
    const onStartDailyQuiz = vi.fn()
    renderHome({ onStartDailyQuiz })
    await user.click(screen.getByText(/Quiz Diario Rápido/))
    expect(onStartDailyQuiz).toHaveBeenCalledOnce()
  })

  // Daily streak chip visibility
  it('does NOT render daily streak chip when streakDays is 0', () => {
    renderHome({ progress: emptyProgress })
    expect(screen.queryByText(/Racha:/)).not.toBeInTheDocument()
  })

  it('renders daily streak chip when streakDays > 0', () => {
    const withStreak: Progress = {
      ...emptyProgress,
      dailyQuiz: { streakDays: 5, lastCompletedDate: '2026-05-08' },
    }
    renderHome({ progress: withStreak })
    expect(screen.getByText(/Racha: 5 días/)).toBeInTheDocument()
  })
})
