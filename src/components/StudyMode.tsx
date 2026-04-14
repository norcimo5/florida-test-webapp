import { useState } from 'react'
import type { Question, Progress, Category } from '../types'
import './StudyMode.css'

interface Props {
  questions: Question[]
  progress: Progress
  onProgressUpdate: (p: Progress) => void
  onBack: () => void
  reviewMode: boolean
}

const CATEGORY_LABELS: Record<Category, string> = {
  'traffic-signals': 'Señales',
  'speed-limits': 'Velocidad',
  'right-of-way': 'Prioridad',
  'school-zones': 'Escuelas',
  'dui': 'DUI',
  'road-markings': 'Marcas',
  'general': 'General',
}

export default function StudyMode({ questions, progress, onProgressUpdate, onBack, reviewMode }: Props) {
  const displayQuestions = reviewMode
    ? questions.filter(q => {
        const a = progress.studyAnswers[q.id]
        return a && !a.correct
      })
    : questions

  const categories = Array.from(new Set(displayQuestions.map(q => q.category))) as Category[]
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')
  const [currentIndex, setCurrentIndex] = useState(0)

  const filtered = activeCategory === 'all'
    ? displayQuestions
    : displayQuestions.filter(q => q.category === activeCategory)

  const question = filtered[currentIndex]
  const answer = question ? progress.studyAnswers[question.id] : undefined
  const hasAnswered = !!answer

  function handleSelect(index: number) {
    if (!question || hasAnswered) return
    const correct = index === question.en.correct
    const updated: Progress = {
      ...progress,
      studyAnswers: {
        ...progress.studyAnswers,
        [question.id]: { selectedIndex: index, correct },
      },
    }
    onProgressUpdate(updated)
  }

  function toggleBookmark() {
    if (!question) return
    const bookmarks = progress.bookmarks.includes(question.id)
      ? progress.bookmarks.filter(id => id !== question.id)
      : [...progress.bookmarks, question.id]
    onProgressUpdate({ ...progress, bookmarks })
  }

  if (!question) {
    return (
      <div className="study__empty">
        <p>No hay preguntas en esta categoría.</p>
        <button className="study__back-btn" onClick={onBack}>← Volver</button>
      </div>
    )
  }

  const isBookmarked = progress.bookmarks.includes(question.id)

  return (
    <div className="study">
      <header className="study__header">
        <button className="study__back-btn" onClick={onBack}>← Inicio</button>
        <span className="study__counter">Pregunta {currentIndex + 1} de {filtered.length}</span>
        <button
          className={`study__bookmark-btn ${isBookmarked ? 'study__bookmark-btn--active' : ''}`}
          onClick={toggleBookmark}
        >
          {isBookmarked ? '🔖 Guardada' : '🔖 Guardar'}
        </button>
      </header>

      {categories.length > 1 && (
        <div className="study__categories">
          <button
            className={`study__cat-pill ${activeCategory === 'all' ? 'study__cat-pill--active' : ''}`}
            onClick={() => { setActiveCategory('all'); setCurrentIndex(0) }}
          >
            Todas ({displayQuestions.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`study__cat-pill ${activeCategory === cat ? 'study__cat-pill--active' : ''}`}
              onClick={() => { setActiveCategory(cat); setCurrentIndex(0) }}
            >
              {CATEGORY_LABELS[cat]} ({displayQuestions.filter(q => q.category === cat).length})
            </button>
          ))}
        </div>
      )}

      <main className="study__main">
        <div className="study__bilingual">
          <div className="study__panel study__panel--en">
            <div className="study__panel-label">ENGLISH — EXAM FORMAT</div>
            <p className="study__question">{question.en.question}</p>
            <div className="study__choices">
              {question.en.choices.map((choice, i) => (
                <button
                  key={i}
                  className={`study__choice ${
                    hasAnswered
                      ? i === question.en.correct
                        ? 'study__choice--correct'
                        : i === answer.selectedIndex && !answer.correct
                          ? 'study__choice--wrong'
                          : ''
                      : ''
                  }`}
                  onClick={() => handleSelect(i)}
                  disabled={hasAnswered}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div className="study__panel study__panel--es">
            <div className="study__panel-label">ESPAÑOL — AYUDA</div>
            {question.es ? (
              <>
                <p className="study__question">{question.es.question}</p>
                <div className="study__choices">
                  {question.es.choices.map((choice, i) => (
                    <div
                      key={i}
                      className={`study__choice study__choice--es ${
                        hasAnswered && i === question.en.correct ? 'study__choice--correct-es' : ''
                      }`}
                    >
                      {choice}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="study__no-translation">Traducción no disponible</p>
            )}
          </div>
        </div>

        <div className="study__keywords">
          <div className="study__keywords-label">PALABRAS CLAVE EN INGLÉS — MEMORIZA ESTAS</div>
          <div className="study__keywords-list">
            {question.keywords.map((kw, i) => (
              <div key={i} className="study__keyword-card">
                <span className="study__keyword-en">{kw.en}</span>
                <span className="study__keyword-es">{kw.es}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="study__nav">
          <button
            className="study__nav-btn study__nav-btn--prev"
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            ← Anterior
          </button>
          <button
            className="study__nav-btn study__nav-btn--next"
            onClick={() => setCurrentIndex(i => Math.min(filtered.length - 1, i + 1))}
            disabled={currentIndex === filtered.length - 1}
          >
            Siguiente →
          </button>
        </div>
      </main>
    </div>
  )
}
