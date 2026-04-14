import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import StudyMode from '../src/components/StudyMode'
import type { Question, Progress } from '../src/types'

const mockQuestion: Question = {
  id: 'q_0001',
  en: {
    question: 'What should you do when you see a flashing yellow light?',
    choices: ['Stop completely', 'Speed up', 'Slow down and proceed with caution', 'Yield'],
    correct: 2,
  },
  es: {
    question: '¿Qué debe hacer cuando ve una luz amarilla intermitente?',
    choices: ['Detenerse', 'Acelerar', 'Disminuir velocidad y proceder con precaución', 'Ceder'],
  },
  keywords: [
    { en: 'flashing yellow', es: 'luz amarilla intermitente' },
    { en: 'slow down', es: 'disminuir velocidad' },
  ],
  category: 'traffic-signals',
  source: 'seed',
}

const defaultProgress: Progress = {
  studyAnswers: {},
  bookmarks: [],
  examQuestionIds: [],
  examAnswers: [],
  examComplete: false,
}

describe('StudyMode', () => {
  it('renders the English question', () => {
    render(
      <StudyMode
        questions={[mockQuestion]}
        progress={defaultProgress}
        onProgressUpdate={vi.fn()}
        onBack={vi.fn()}
        reviewMode={false}
      />
    )
    expect(screen.getByText(/flashing yellow light/i)).toBeInTheDocument()
  })

  it('renders the Spanish question', () => {
    render(
      <StudyMode
        questions={[mockQuestion]}
        progress={defaultProgress}
        onProgressUpdate={vi.fn()}
        onBack={vi.fn()}
        reviewMode={false}
      />
    )
    expect(screen.getAllByText(/luz amarilla intermitente/i).length).toBeGreaterThan(0)
  })

  it('renders keywords in PALABRAS CLAVE box', () => {
    render(
      <StudyMode
        questions={[mockQuestion]}
        progress={defaultProgress}
        onProgressUpdate={vi.fn()}
        onBack={vi.fn()}
        reviewMode={false}
      />
    )
    expect(screen.getByText('flashing yellow')).toBeInTheDocument()
    expect(screen.getByText('slow down')).toBeInTheDocument()
  })

  it('calls onProgressUpdate when an answer is selected', async () => {
    const onProgressUpdate = vi.fn()
    render(
      <StudyMode
        questions={[mockQuestion]}
        progress={defaultProgress}
        onProgressUpdate={onProgressUpdate}
        onBack={vi.fn()}
        reviewMode={false}
      />
    )
    // Click the correct answer (index 2 = "Slow down and proceed with caution")
    // It appears in both EN and ES panels — click the first occurrence
    const choices = screen.getAllByText(/Slow down and proceed with caution/i)
    await userEvent.click(choices[0])
    expect(onProgressUpdate).toHaveBeenCalled()
  })

  it('shows "Traducción no disponible" when ES is null', () => {
    const noTranslation: Question = { ...mockQuestion, es: null }
    render(
      <StudyMode
        questions={[noTranslation]}
        progress={defaultProgress}
        onProgressUpdate={vi.fn()}
        onBack={vi.fn()}
        reviewMode={false}
      />
    )
    expect(screen.getByText(/Traducción no disponible/i)).toBeInTheDocument()
  })
})
