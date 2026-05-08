import { useState, useEffect, useRef } from 'react'
import type { Question, Progress, AppSettings } from '../types'
import { GradientHeader } from './GradientHeader'
import './ExamMode.css'

interface Props {
  questions: Question[]
  progress: Progress
  settings: AppSettings
  onProgressUpdate: (p: Progress) => void
  onComplete: () => void
  onBack: () => void
}

export default function ExamMode({ questions, progress, settings, onProgressUpdate, onComplete, onBack }: Props) {
  // Build ordered exam question list on first render
  const examQuestions = progress.examQuestionIds.length > 0
    ? progress.examQuestionIds
        .map(id => questions.find(q => q.id === id))
        .filter((q): q is Question => q !== undefined)
    : shuffleQuestions(questions, settings.examLength)

  // If examQuestionIds was empty, persist the shuffled set immediately
  if (progress.examQuestionIds.length === 0) {
    onProgressUpdate({
      ...progress,
      examQuestionIds: examQuestions.map(q => q.id),
    })
  }

  const [currentIndex, setCurrentIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const timerLabel = `⏱ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const currentQuestion = examQuestions[currentIndex]
  const currentAnswer = progress.examAnswers.find(a => a.questionId === currentQuestion?.id)
  const isLast = currentIndex === examQuestions.length - 1

  function handleSelect(index: number) {
    if (!currentQuestion || currentAnswer) return
    const examAnswers = [
      ...progress.examAnswers,
      { questionId: currentQuestion.id, selectedIndex: index },
    ]
    onProgressUpdate({ ...progress, examAnswers })
  }

  function handleFinish() {
    onProgressUpdate({ ...progress, examComplete: true })
    onComplete()
  }

  if (!currentQuestion) return null

  return (
    <div className="exam">
      <GradientHeader
        variant="strip"
        title="Examen Completo"
        left={
          <button className="exam__back-btn" onClick={onBack} aria-label="Salir del examen">← Salir</button>
        }
        right={
          <span className="exam__timer" aria-label="Tiempo transcurrido">{timerLabel}</span>
        }
      />
      <div className="exam__progress-wrap">
        <div className="exam__progress-bar">
          <div
            className="exam__progress-fill"
            style={{ width: `${((currentIndex + 1) / examQuestions.length) * 100}%` }}
          />
        </div>
        <span className="exam__counter">Pregunta {currentIndex + 1} de {examQuestions.length}</span>
      </div>

      <main className="exam__main">
        <div className="exam__card">
          <div className="exam__label">🇺🇸 EXAMEN — SOLO INGLÉS</div>
          <p className="exam__question" lang="en">{currentQuestion.en.question}</p>
          <div className="exam__choices">
            {currentQuestion.en.choices.map((choice, i) => (
              <button
                key={i}
                className={`exam__choice ${currentAnswer?.selectedIndex === i ? 'exam__choice--selected' : ''}`}
                onClick={() => handleSelect(i)}
                disabled={!!currentAnswer}
                lang="en"
              >
                <span className="exam__choice-letter">
                  {String.fromCharCode(65 + i)}
                </span>
                {choice}
              </button>
            ))}
          </div>
        </div>

        <div className="exam__nav">
          <button
            className="exam__nav-btn exam__nav-btn--prev"
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            aria-label="Pregunta anterior"
          >
            ← Anterior
          </button>
          {isLast ? (
            <button
              className="exam__nav-btn exam__nav-btn--finish"
              onClick={handleFinish}
              aria-label="Terminar examen"
            >
              Terminar Examen ✓
            </button>
          ) : (
            <button
              className="exam__nav-btn exam__nav-btn--next"
              onClick={() => setCurrentIndex(i => i + 1)}
              aria-label="Siguiente pregunta"
            >
              Siguiente →
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

function shuffleQuestions(questions: Question[], count: number): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
