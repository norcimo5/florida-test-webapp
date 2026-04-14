import type { Progress, AppSettings, Screen } from '../types'
import './HomeScreen.css'

interface Props {
  progress: Progress
  settings: AppSettings
  totalQuestions: number
  onNavigate: (screen: Screen, mode?: 'review') => void
  onOpenOptions: () => void
}

export default function HomeScreen({ progress, settings, totalQuestions, onNavigate, onOpenOptions }: Props) {
  const correct = Object.values(progress.studyAnswers).filter(a => a.correct).length
  const incorrect = Object.values(progress.studyAnswers).filter(a => !a.correct).length
  const unanswered = totalQuestions - correct - incorrect
  const progressPct = Math.round(((correct + incorrect) / totalQuestions) * 100)
  const hasIncorrect = incorrect > 0

  return (
    <div className="home">
      <header className="home__header">
        <span className="home__logo">Florida Driver Prep</span>
        <button className="home__options-btn" onClick={onOpenOptions} aria-label="Opciones">⚙️</button>
      </header>

      <main className="home__main">
        <div className="home__hero">
          <h1 className="home__title">Prepárate para tu Examen de Manejo</h1>
          <p className="home__subtitle">Preguntas reales del examen de Florida · En inglés y español</p>
        </div>

        <div className="home__progress-card">
          <div className="home__progress-label">TU PROGRESO</div>
          <div className="home__stats">
            <div className="home__stat home__stat--correct">
              <span className="home__stat-value">{correct}</span>
              <span className="home__stat-name">Correctas</span>
            </div>
            <div className="home__stat home__stat--incorrect">
              <span className="home__stat-value">{incorrect}</span>
              <span className="home__stat-name">Incorrectas</span>
            </div>
            <div className="home__stat home__stat--unanswered">
              <span className="home__stat-value">{unanswered}</span>
              <span className="home__stat-name">Sin responder</span>
            </div>
          </div>
          <div className="home__progress-bar">
            <div className="home__progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="home__progress-pct">{progressPct}% completado · {totalQuestions} preguntas totales</div>
        </div>

        <div className="home__modes">
          <button className="home__mode-btn home__mode-btn--exam" onClick={() => onNavigate('exam')}>
            <span className="home__mode-icon">📝</span>
            <span className="home__mode-title">Examen Simulado</span>
            <span className="home__mode-desc">{settings.examLength} preguntas en inglés · Como el examen real</span>
          </button>
          <button className="home__mode-btn home__mode-btn--study" onClick={() => onNavigate('study')}>
            <span className="home__mode-icon">📚</span>
            <span className="home__mode-title">Modo Estudio</span>
            <span className="home__mode-desc">Bilingüe · Palabras clave · Por categoría</span>
          </button>
        </div>

        {hasIncorrect && (
          <button className="home__review-btn" onClick={() => onNavigate('study', 'review')}>
            <div className="home__review-text">
              <span className="home__review-title">🔖 Repasar preguntas incorrectas</span>
              <span className="home__review-count">{incorrect} preguntas marcadas para repasar</span>
            </div>
            <span className="home__review-arrow">Repasar →</span>
          </button>
        )}
      </main>
    </div>
  )
}
