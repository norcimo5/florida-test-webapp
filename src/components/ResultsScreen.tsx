import type { Question, Progress, Category } from '../types'
import './ResultsScreen.css'

interface Props {
  questions: Question[]
  progress: Progress
  onRetry: () => void
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

export default function ResultsScreen({ questions, progress, onRetry, onStudy, onBack }: Props) {
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

  return (
    <div className="results">
      <header className="results__header">
        <button className="results__back-btn" onClick={onBack}>← Inicio</button>
      </header>

      <main className="results__main">
        <div className={`results__hero ${passed ? 'results__hero--pass' : 'results__hero--fail'}`}>
          <div className="results__icon">{passed ? '🎉' : '📚'}</div>
          <div className={`results__verdict ${passed ? 'results__verdict--pass' : 'results__verdict--fail'}`}>
            {passed ? 'APROBADO' : 'REPROBADO'}
          </div>
          <div className="results__score">{correct} / {total}</div>
          <div className="results__pct">{pct}% correcto · {passed ? 'Pasaste el umbral del 80%' : 'Necesitas 80% para aprobar'}</div>
        </div>

        <div className="results__breakdown">
          <div className="results__breakdown-title">Resultados por Categoría</div>
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
          <button className="results__action-btn results__action-btn--retry" onClick={onRetry}>
            🔄 Intentar de nuevo
          </button>
          <button className="results__action-btn results__action-btn--study" onClick={onStudy}>
            📚 Estudiar preguntas falladas
          </button>
        </div>
      </main>
    </div>
  )
}
