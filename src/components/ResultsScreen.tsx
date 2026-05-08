import { useEffect, useRef } from 'react'
import type { Question, Progress, Category } from '../types'
import { GradientHeader } from './GradientHeader'
import { pushMockExamRecord } from '../store/progressStore'
import './ResultsScreen.css'

interface Props {
  questions: Question[]
  progress: Progress
  onProgressUpdate: (p: Progress) => void
  onStudy: () => void
  onBack: () => void
}

const CATEGORY_LABELS: Record<Category, string> = {
  'traffic-signals': '🚦 Señales de Tráfico',
  'speed-limits': '🚗 Límites de Velocidad',
  'right-of-way': '⬆️ Prioridad de Paso',
  'school-zones': '🏫 Zonas Escolares',
  'dui': '🍺 Alcohol al Volante',
  'road-markings': '🛣️ Marcas Viales',
  'general': '📋 General',
}

export default function ResultsScreen({ questions, progress, onProgressUpdate, onStudy, onBack }: Props) {
  const examQs = progress.examQuestionIds
    .map(id => questions.find(q => q.id === id))
    .filter((q): q is Question => q !== undefined)

  const total = examQs.length
  const correct = progress.examAnswers.filter(a => {
    const q = questions.find(q => q.id === a.questionId)
    return q && a.selectedIndex === q.en.correct
  }).length

  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const passed = pct >= 80

  // Per-category breakdown
  const categoryMap = new Map<Category, { correct: number; total: number }>()
  for (const q of examQs) {
    const entry = categoryMap.get(q.category) ?? { correct: 0, total: 0 }
    const answer = progress.examAnswers.find(a => a.questionId === q.id)
    entry.total++
    if (answer && answer.selectedIndex === q.en.correct) entry.correct++
    categoryMap.set(q.category, entry)
  }

  // ── Persist mock exam record on first render (guard against double-push) ──
  const persistedRef = useRef(false)
  useEffect(() => {
    if (persistedRef.current) return
    if (total === 0) return

    // Guard: skip if latest mockHistory entry already matches this completion
    const latest = progress.mockHistory[progress.mockHistory.length - 1]
    const recentThreshold = Date.now() - 5 * 60 * 1000 // 5 minutes
    if (
      latest &&
      latest.scoreCorrect === correct &&
      latest.scoreTotal === total &&
      new Date(latest.takenAt).getTime() > recentThreshold
    ) {
      persistedRef.current = true
      return
    }

    persistedRef.current = true
    const now = new Date().toISOString()
    const updated = pushMockExamRecord(progress, {
      id: now,
      scoreCorrect: correct,
      scoreTotal: total,
      takenAt: now,
    })
    onProgressUpdate(updated)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Header content ────────────────────────────────────────────────────────
  const headline = passed ? '🎉 ¡APROBASTE!' : '😔 Sigue practicando'
  const scoreLine = `${correct} / ${total}  =  ${pct}%`
  const subtext = `(Necesitas 40 / 50 para aprobar)`

  const heroContent = (
    <div className="results__hero-body">
      <div className="results__verdict">{headline}</div>
      <div className="results__score">{scoreLine}</div>
      <div className="results__subtext">{subtext}</div>
    </div>
  )

  return (
    <div className="results">
      <GradientHeader
        variant="full"
        left={
          <button className="results__back-btn" onClick={onBack}>← Inicio</button>
        }
      >
        {heroContent}
      </GradientHeader>

      <main className="results__main">
        <div className="results__breakdown">
          <div className="results__breakdown-title">DESEMPEÑO POR CATEGORÍA</div>
          {Array.from(categoryMap.entries()).map(([cat, { correct: c, total: t }]) => (
            <div key={cat} className="results__breakdown-row">
              <span className="results__breakdown-cat">{CATEGORY_LABELS[cat]}</span>
              <div className="results__breakdown-bar-wrap">
                <div className="results__breakdown-bar">
                  <div
                    className={`results__breakdown-fill ${c / t >= 0.8 ? 'results__breakdown-fill--pass' : 'results__breakdown-fill--fail'}`}
                    style={{ width: `${Math.round((c / t) * 100)}%` }}
                  />
                </div>
                <span className="results__breakdown-fraction">{c}/{t}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="results__actions">
          <button className="results__action-btn results__action-btn--study" onClick={onStudy}>
            📚 Repasar Errores
          </button>
          <button className="results__action-btn results__action-btn--back" onClick={onBack}>
            Volver al Inicio
          </button>
        </div>
      </main>
    </div>
  )
}
