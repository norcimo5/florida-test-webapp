import type { Question, Progress, AppSettings } from '../types'
import { GradientHeader } from './GradientHeader'
import {
  passProbabilityPct,
  masteredKeywordsCount,
} from '../store/computed'
import './PerfilScreen.css'

interface PerfilProps {
  questions: Question[]
  progress: Progress
  settings: AppSettings
  onNavigateToAjustes: () => void
}

export function PerfilScreen({
  questions,
  progress,
  settings,
  onNavigateToAjustes,
}: PerfilProps) {
  const userName = settings.userName || 'TESTUSER'
  const avatarLetter = userName.charAt(0).toUpperCase()

  const preguntasRespondidas = Object.keys(progress.studyAnswers).length
  const rachaActual = progress.dailyQuiz.streakDays
  const probabilidad = passProbabilityPct(progress, questions)
  const palabrasDominadas = masteredKeywordsCount(progress)

  return (
    <div className="perfil">
      <GradientHeader variant="strip" title="Perfil" />

      <div className="perfil__body">
        {/* ── Avatar + name ───────────────────────────────────────────────── */}
        <div className="perfil__avatar-section">
          <div
            className="perfil__avatar"
            aria-label={`Avatar de ${userName}`}
            aria-hidden="true"
          >
            {avatarLetter}
          </div>
          <h2 className="perfil__name">{userName}</h2>
        </div>

        {/* ── Stats list ──────────────────────────────────────────────────── */}
        <ul className="perfil__stats" aria-label="Estadísticas de usuario">
          <li className="perfil__stat-row">
            <span className="perfil__stat-label">Preguntas respondidas</span>
            <span className="perfil__stat-value">{preguntasRespondidas}</span>
          </li>
          <li className="perfil__stat-row">
            <span className="perfil__stat-label">Racha actual</span>
            <span className="perfil__stat-value">
              {rachaActual} día{rachaActual !== 1 ? 's' : ''}
            </span>
          </li>
          <li className="perfil__stat-row">
            <span className="perfil__stat-label">Probabilidad de aprobar</span>
            <span className="perfil__stat-value">{probabilidad}%</span>
          </li>
          <li className="perfil__stat-row">
            <span className="perfil__stat-label">Palabras dominadas</span>
            <span className="perfil__stat-value">{palabrasDominadas}</span>
          </li>
        </ul>

        {/* ── Footer link to Ajustes ──────────────────────────────────────── */}
        <div className="perfil__footer">
          <button
            className="perfil__ajustes-link"
            type="button"
            onClick={onNavigateToAjustes}
            aria-label="Ir a ajustes"
          >
            Ver ajustes →
          </button>
        </div>
      </div>
    </div>
  )
}

export default PerfilScreen
