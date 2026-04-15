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
  explanation: 'Flashing yellow significa reducir la velocidad. Solo flashing red significa detenerse.',
  category: 'traffic-signals',
  source: 'flhsmv-2026',
}

const defaultProgress: Progress = {
  studyAnswers: {},
  bookmarks: [],
  examQuestionIds: [],
  examAnswers: [],
  examComplete: false,
}

function renderStudy(overrides: Partial<Parameters<typeof StudyMode>[0]> = {}) {
  return render(
    <StudyMode
      questions={[mockQuestion]}
      progress={defaultProgress}
      onProgressUpdate={vi.fn()}
      onBack={vi.fn()}
      reviewMode={false}
      {...overrides}
    />
  )
}

describe('StudyMode', () => {
  it('renders the English question text', () => {
    const { container } = renderStudy()
    expect(container.querySelector('.study__question')).toBeInTheDocument()
    expect(container.querySelector('.study__question')!.textContent).toMatch(/flashing yellow light/i)
  })

  it('renders the Spanish chip when es is present', () => {
    renderStudy()
    expect(screen.getByText('ocultar')).toBeInTheDocument()
  })

  it('hides Spanish text and shows "mostrar" when ocultar is clicked', async () => {
    renderStudy()
    await userEvent.click(screen.getByText('ocultar'))
    expect(screen.queryByText('ocultar')).not.toBeInTheDocument()
    expect(screen.getByText('mostrar')).toBeInTheDocument()
  })

  it('does not render Spanish chip when es is null', () => {
    renderStudy({ questions: [{ ...mockQuestion, es: null }] })
    expect(screen.queryByText('ocultar')).not.toBeInTheDocument()
    expect(screen.queryByText('mostrar')).not.toBeInTheDocument()
  })

  it('renders keywords in PALABRAS CLAVE section', () => {
    const { container } = renderStudy()
    const enKeywords = container.querySelectorAll('.study__keyword-en')
    const texts = Array.from(enKeywords).map(el => el.textContent)
    expect(texts).toContain('flashing yellow')
    expect(texts).toContain('slow down')
  })

  it('renders a Siguiente button', () => {
    renderStudy()
    expect(screen.getByText(/Siguiente/i)).toBeInTheDocument()
  })

  it('does not render an Anterior button', () => {
    renderStudy()
    expect(screen.queryByText(/Anterior/i)).not.toBeInTheDocument()
  })

  it('calls onProgressUpdate when an answer is selected', async () => {
    const onProgressUpdate = vi.fn()
    renderStudy({ onProgressUpdate })
    const choices = screen.getAllByRole('button', { name: /Slow down and proceed/i })
    await userEvent.click(choices[0])
    expect(onProgressUpdate).toHaveBeenCalled()
  })

  it('shows ¿POR QUÉ? box after answering wrong', async () => {
    renderStudy()
    await userEvent.click(screen.getAllByRole('button', { name: /Stop completely/i })[0])
    expect(screen.getByText(/¿POR QUÉ\?/)).toBeInTheDocument()
  })

  it('shows ¿POR QUÉ? box after answering correct', async () => {
    renderStudy()
    await userEvent.click(screen.getAllByRole('button', { name: /Slow down and proceed/i })[0])
    expect(screen.getByText(/¿POR QUÉ\?/)).toBeInTheDocument()
  })

  it('does not show ¿POR QUÉ? when explanation is absent', async () => {
    renderStudy({ questions: [{ ...mockQuestion, explanation: undefined }] })
    await userEvent.click(screen.getAllByRole('button', { name: /Stop completely/i })[0])
    expect(screen.queryByText(/¿POR QUÉ\?/)).not.toBeInTheDocument()
  })

  it('highlights keywords with mark elements', () => {
    const { container } = renderStudy()
    expect(container.querySelector('mark')).toBeInTheDocument()
  })

  it('choices are disabled after answering', async () => {
    renderStudy()
    const choiceBtn = screen.getAllByRole('button', { name: /Stop completely/i })[0]
    await userEvent.click(choiceBtn)
    const allChoices = screen.getAllByRole('button').filter(b =>
      ['Stop completely', 'Speed up', 'Slow down', 'Yield'].some(t => b.textContent?.includes(t))
    )
    allChoices.forEach(btn => expect(btn).toBeDisabled())
  })
})
