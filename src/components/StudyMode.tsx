import { useState } from 'react'
import type { Question, Progress, Category, StudyAnswer, MacroTopic } from '../types'
import { GradientHeader } from './GradientHeader'
import { MACRO_TOPIC_MAP } from '../store/computed'
import './StudyMode.css'

interface Props {
  questions: Question[]
  progress: Progress
  onProgressUpdate: (p: Progress) => void
  onBack: () => void
  reviewMode: boolean
  /** If set, pre-filters the question pool to this macro topic before any other filtering. */
  filterTopic?: MacroTopic
}

const CATEGORY_LABELS: Record<Category, string> = {
  'traffic-signals': 'Señales',
  'speed-limits': 'Velocidad',
  'right-of-way': 'Prioridad',
  'school-zones': 'Escuelas',
  'dui': 'Alcohol',
  'road-markings': 'Marcas',
  'general': 'General',
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightKeywords(text: string, keywords: string[]): string {
  let result = escapeHtml(text)
  for (const kw of keywords) {
    const escapedKw = escapeHtml(kw)
    const regex = new RegExp(escapedKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    result = result.replace(regex, match => `<mark>${match}</mark>`)
  }
  return result
}

function pickWeightedRandom(
  pool: Question[],
  studyAnswers: Record<string, StudyAnswer>,
  excludeId: string | null
): Question {
  const candidates = excludeId ? pool.filter(q => q.id !== excludeId) : pool
  const eligible = candidates.length > 0 ? candidates : pool
  const weights = eligible.map(q => {
    const a = studyAnswers[q.id]
    if (!a) return 2         // unseen
    if (!a.correct) return 4 // wrong
    return 1                 // correct
  })
  const total = weights.reduce((sum, w) => sum + w, 0)
  let rand = Math.random() * total
  for (let i = 0; i < eligible.length; i++) {
    rand -= weights[i]
    if (rand <= 0) return eligible[i]
  }
  return eligible[eligible.length - 1]
}

export default function StudyMode({ questions, progress, onProgressUpdate, onBack, reviewMode, filterTopic }: Props) {
  // If filterTopic is set, narrow the pool to those categories first
  const topicFilteredQuestions = filterTopic
    ? questions.filter(q => MACRO_TOPIC_MAP[filterTopic].includes(q.category))
    : questions

  const displayQuestions = reviewMode
    ? topicFilteredQuestions.filter(q => {
        const a = progress.studyAnswers[q.id]
        return a && !a.correct
      })
    : topicFilteredQuestions

  const categories = Array.from(new Set(displayQuestions.map(q => q.category))) as Category[]
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')

  const getFiltered = (cat: Category | 'all') =>
    cat === 'all' ? displayQuestions : displayQuestions.filter(q => q.category === cat)

  const filtered = getFiltered(activeCategory)

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(
    () => displayQuestions.length > 0
      ? pickWeightedRandom(displayQuestions, progress.studyAnswers, null)
      : null
  )
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, StudyAnswer>>({})
  const [esVisible, setEsVisible] = useState(true)

  const question = currentQuestion && filtered.some(q => q.id === currentQuestion.id)
    ? currentQuestion
    : filtered[0] ?? null

  const sessionAnswer = question ? sessionAnswers[question.id] : undefined
  const hasAnswered = !!sessionAnswer
  const answeredCount = filtered.filter(q => sessionAnswers[q.id] !== undefined).length

  const enKeywords = question?.keywords.map(k => k.en) ?? []
  const esKeywords = question?.keywords.map(k => k.es) ?? []
  const enQuestionHtml = question ? highlightKeywords(question.en.question, enKeywords) : ''
  const esQuestionHtml = question?.es ? highlightKeywords(question.es.question, esKeywords) : ''
  const explanationHtml = question?.explanation ? highlightKeywords(question.explanation, enKeywords) : ''

  const cardBorderColor = !hasAnswered ? 'var(--color-brand-blue)' : sessionAnswer.correct ? 'var(--color-success)' : 'var(--color-error)'

  function handleSelect(index: number) {
    if (!question || hasAnswered) return
    const correct = index === question.en.correct
    const newAnswer: StudyAnswer = { selectedIndex: index, correct }
    setSessionAnswers(prev => ({ ...prev, [question.id]: newAnswer }))
    onProgressUpdate({
      ...progress,
      studyAnswers: { ...progress.studyAnswers, [question.id]: newAnswer },
    })
  }

  function handleNext() {
    if (filtered.length === 0) return
    setCurrentQuestion(pickWeightedRandom(filtered, progress.studyAnswers, question?.id ?? null))
    setEsVisible(true)
  }

  function handleCategoryChange(cat: Category | 'all') {
    setActiveCategory(cat)
    const pool = getFiltered(cat)
    if (pool.length > 0) {
      setCurrentQuestion(pickWeightedRandom(pool, progress.studyAnswers, null))
    }
    setEsVisible(true)
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
  const progressPct = filtered.length > 0 ? (answeredCount / filtered.length) * 100 : 0

  return (
    <div className="study">
      <GradientHeader
        variant="strip"
        title="Estudio"
        left={
          <button className="study__back-btn" onClick={onBack} aria-label="Volver al Inicio">← Inicio</button>
        }
        right={
          <button
            className={`study__bookmark-btn ${isBookmarked ? 'study__bookmark-btn--active' : ''}`}
            onClick={toggleBookmark}
            aria-label="Guardar pregunta"
          >
            🔖
          </button>
        }
      />
      <div className="study__progress-wrap">
        <div
          className="study__progress-bar"
          role="progressbar"
          aria-valuenow={answeredCount}
          aria-valuemin={0}
          aria-valuemax={filtered.length}
          aria-label={`Progreso de estudio: ${answeredCount} de ${filtered.length}`}
        >
          <div className="study__progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="study__counter">{answeredCount} / {filtered.length}</span>
      </div>

      {categories.length > 1 && (
        <div className="study__categories">
          <button
            className={`study__cat-pill ${activeCategory === 'all' ? 'study__cat-pill--active' : ''}`}
            onClick={() => handleCategoryChange('all')}
          >
            Todas ({displayQuestions.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`study__cat-pill ${activeCategory === cat ? 'study__cat-pill--active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {CATEGORY_LABELS[cat]} ({displayQuestions.filter(q => q.category === cat).length})
            </button>
          ))}
        </div>
      )}

      <main className="study__main">
        <div className="study__card" style={{ borderColor: cardBorderColor }}>
          <div className="study__panel-label" style={{ color: cardBorderColor }}>
            🇺🇸 INGLÉS — FORMATO EXAMEN
          </div>

          <p className="study__question" lang="en" dangerouslySetInnerHTML={{ __html: enQuestionHtml }} />

          {question.es && (
            <div className="study__es-chip">
              <div className="study__es-chip-left">
                <span className="study__es-flag">🇪🇸</span>
                {esVisible && (
                  <span className="study__es-text" dangerouslySetInnerHTML={{ __html: esQuestionHtml }} />
                )}
              </div>
              <button
                className="study__es-toggle"
                onClick={() => setEsVisible(v => !v)}
                aria-label={esVisible ? 'Ocultar traducción al español' : 'Mostrar traducción al español'}
              >
                {esVisible ? 'ocultar' : 'mostrar'}
              </button>
            </div>
          )}

          <div className="study__choices">
            {question.en.choices.map((choice, i) => {
              const isCorrect = hasAnswered && i === question.en.correct
              const isWrong = hasAnswered && i === sessionAnswer.selectedIndex && !sessionAnswer.correct
              return (
                <button
                  key={i}
                  className={`study__choice ${isCorrect ? 'study__choice--correct' : ''} ${isWrong ? 'study__choice--wrong' : ''}`}
                  onClick={() => handleSelect(i)}
                  disabled={hasAnswered}
                  lang="en"
                >
                  {isCorrect && '✓ '}
                  {isWrong && '✗ '}
                  {choice}
                  {isWrong && <span className="study__choice-label"> (tu respuesta)</span>}
                </button>
              )
            })}
          </div>

          {hasAnswered && question.explanation && (
            <div className={`study__porque ${sessionAnswer.correct ? 'study__porque--correct' : 'study__porque--wrong'}`}>
              <div className="study__porque-label">
                ¿POR QUÉ?{sessionAnswer.correct ? ' ✓' : ''}
              </div>
              <div className="study__porque-text" dangerouslySetInnerHTML={{ __html: explanationHtml }} />
            </div>
          )}
        </div>

        <div className="study__keywords">
          <div className="study__keywords-label">PALABRAS CLAVE — MEMORIZA</div>
          <div className="study__keywords-list">
            {question.keywords.map((kw, i) => (
              <div key={i} className="study__keyword-item">
                <span className="study__keyword-en">{kw.en}</span>
                <span className="study__keyword-arrow">→</span>
                <span className="study__keyword-es">{kw.es}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="study__nav">
          <button className="study__nav-btn" onClick={handleNext} aria-label="Siguiente pregunta">
            Siguiente →
          </button>
        </div>
      </main>
    </div>
  )
}
