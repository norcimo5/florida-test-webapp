import type { Question, Progress, AppSettings, MacroTopic } from '../types'
import { GradientHeader } from './GradientHeader'
import { TopicCard } from './TopicCard'
import { PerformanceChart } from './PerformanceChart'
import {
  topicMasteryPct,
  passProbabilityPct,
  masteredKeywordsCount,
  getRecentMockScores,
  shouldShowReadyChip,
} from '../store/computed'
import './HomeScreen.css'

interface Props {
  questions: Question[]
  progress: Progress
  settings: AppSettings
  onTopicTap: (topic: MacroTopic) => void
  onStartFullMock: () => void
  onStartDailyQuiz: () => void
}

const MACRO_TOPICS: MacroTopic[] = ['senales', 'reglas', 'seguridad', 'especial']

export default function HomeScreen({
  questions,
  progress,
  settings,
  onTopicTap,
  onStartFullMock,
  onStartDailyQuiz,
}: Props) {
  const userName = settings.userName || 'TESTUSER'
  const passPct = passProbabilityPct(progress, questions)
  const masteredCount = masteredKeywordsCount(progress)
  const recentScores = getRecentMockScores(progress, 2)
  const showReadyChip = shouldShowReadyChip(progress)
  const streakDays = progress.dailyQuiz.streakDays

  const isEmpty =
    Object.keys(progress.studyAnswers).length === 0 &&
    progress.mockHistory.length === 0

  const avatarLetter = userName.charAt(0).toUpperCase()

  // ── Header slots ────────────────────────────────────────────────────────────
  const avatarSlot = (
    <div className="home__avatar" aria-hidden="true">
      {avatarLetter}
    </div>
  )

  const bellSlot = (
    <button
      className="home__bell-btn"
      type="button"
      aria-label="Notificaciones"
    >
      🔔
    </button>
  )

  return (
    <div className="home">
      <GradientHeader
        variant="full"
        title="FL DMV Prep"
        left={avatarSlot}
        right={bellSlot}
      >
        {/* Subtitle */}
        <p className="home__subtitle">🛡 FL DMV ACADEMIA</p>

        {/* Greeting */}
        <h2 className="home__greeting">¡Hola, {userName}!</h2>

        {/* Probability sentence */}
        <p className="home__prob-sentence">
          Estás {passPct}% listo/a para aprobar
        </p>

        {/* Vocab streak chip */}
        <div className="home__streak-chip">
          🔥 {masteredCount} palabras dominadas
        </div>

        {/* Daily quiz streak (only if active) */}
        {streakDays > 0 && (
          <div className="home__streak-chip home__streak-chip--small">
            Racha: {streakDays} día{streakDays !== 1 ? 's' : ''}
          </div>
        )}

        {/* Progress bar + label */}
        <div className="home__prob-bar-wrap">
          <div
            className="home__prob-bar-track"
            role="progressbar"
            aria-valuenow={passPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Probabilidad de aprobar: ${passPct}%`}
          >
            <div
              className="home__prob-bar-fill"
              style={{ width: `${passPct}%` }}
            />
          </div>
          <span className="home__prob-pct">{passPct}%</span>
        </div>
        <p className="home__prob-label">Probabilidad de Aprobar</p>

        {/* Empty-state microcopy (US-15) */}
        {isEmpty && (
          <p className="home__empty-hint">
            Empieza tu primer estudio para ver tu progreso.
          </p>
        )}
      </GradientHeader>

      {/* ── Three-column body ──────────────────────────────────────────────── */}
      <div className="home__body">
        {/* ── Left column: ESTUDIAR Y ENTRENAR ───────────────────────────── */}
        <section className="home__col home__col--left" aria-label="Estudiar y entrenar">
          <h3 className="home__section-heading">ESTUDIAR Y ENTRENAR</h3>
          <div className="home__topic-list">
            {MACRO_TOPICS.map(topic => (
              <TopicCard
                key={topic}
                topic={topic}
                masteryPct={topicMasteryPct(progress, questions, topic)}
                onTap={() => onTopicTap(topic)}
              />
            ))}
          </div>
        </section>

        {/* ── Center column: EXÁMENES DE PRÁCTICA ─────────────────────────── */}
        <section className="home__col home__col--center" aria-label="Exámenes de práctica">
          <h3 className="home__section-heading">EXÁMENES DE PRÁCTICA</h3>

          {/* Full Mock CTA */}
          <button
            className="home__mock-cta"
            type="button"
            onClick={onStartFullMock}
            aria-label="Empezar examen completo de 50 preguntas"
          >
            <span className="home__mock-cta__icon" aria-hidden="true">⏱</span>
            <span className="home__mock-cta__title">EMPEZAR EXAMEN COMPLETO</span>
            <span className="home__mock-cta__meta">50 PREG.</span>
            <span className="home__mock-cta__meta">10–20 MIN</span>
          </button>

          {/* Daily Quick Quiz */}
          <button
            className="home__quiz-cta"
            type="button"
            onClick={onStartDailyQuiz}
            aria-label="Empezar repaso diario rápido"
          >
            Repaso Diario Rápido →
          </button>
        </section>

        {/* ── Right column: MI PROGRESO ────────────────────────────────────── */}
        <section className="home__col home__col--right" aria-label="Mi progreso">
          <h3 className="home__section-heading">MI PROGRESO</h3>

          {/* Recent scores */}
          <h4 className="home__subsection-heading">Puntajes Recientes</h4>
          {recentScores.length === 0 ? (
            <p className="home__empty-scores">Sin exámenes aún</p>
          ) : (
            <ul className="home__scores-list">
              {recentScores.map((record, idx) => {
                const testNum = progress.mockHistory.length - recentScores.length + idx + 1
                const pct = Math.round((record.scoreCorrect / record.scoreTotal) * 100)
                return (
                  <li key={record.id} className="home__score-item">
                    <span className="home__score-label">Examen {testNum}</span>
                    <span className="home__score-pct">{pct}%</span>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Performance chart */}
          <h4 className="home__subsection-heading">Rendimiento</h4>
          <PerformanceChart
            readiness={progress.dailyReadiness}
            mockScores={progress.mockHistory}
          />

          {/* Ready chip */}
          {showReadyChip && (
            <div className="home__ready-chip" role="status">
              Listo/a para el examen real 🎯
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
