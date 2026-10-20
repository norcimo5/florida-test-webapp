/**
 * TabScreens.tsx — the simpler bottom-nav tabs:
 *   TemasScreen   topic list with progress (ui/screens/TemasScreen.kt)
 *   ExamsScreen   exam hub (ExamHub in ui/nav/AppNav.kt)
 *   PerfilScreen  stats + mock trend + Premium status (ui/screens/PerfilScreen.kt)
 */
import { MACRO_TOPICS, TOPIC_LABELS } from '../../domain/macroTopic'
import { passProbabilityPct, scorePct, topicMasteryPct } from '../../domain/metrics'
import { formatDayEs } from '../../domain/dates'
import { QUESTIONS } from '../../data/questions'
import { useAppState } from '../../store/appStore'
import { useEntitlement } from '../../store/useEntitlement'
import type { Entitlement } from '../../billing/entitlement'
import { navigate } from '../router'
import { AppCard, GradientHeader, ProgressRow, TealButton, TopicIconChip } from '../components/core'
import { TrendChart } from '../components/TrendChart'
import { startDailyQuiz, startFullMock } from './examActions'
import './screens.css'

/** "Temas": one card per study topic with its mastery bar. */
export function TemasScreen() {
  const { answers } = useAppState()
  return (
    <div className="screen-enter">
      <GradientHeader title="Temas" subtitle="Elige un tema para estudiar" />
      <div className="screen-body">
        {MACRO_TOPICS.map((topic) => (
          <AppCard key={topic} stacked onClick={() => navigate(`/study/${topic}`)}>
            <div className="row">
              <TopicIconChip topic={topic} />
              <div className="grow">
                <ProgressRow label={TOPIC_LABELS[topic]} pct={topicMasteryPct(answers, QUESTIONS, topic)} />
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    </div>
  )
}

/** "Exámenes": Full Mock and Daily Quiz entry points. */
export function ExamsScreen() {
  const { quizDay } = useAppState()
  const { premium, today } = useEntitlement()
  return (
    <div className="screen-enter">
      <GradientHeader title="Exámenes" subtitle="Pon a prueba lo aprendido" />
      <div className="screen-body">
        <AppCard stacked>
          <h2 className="card-title t-title-medium">Examen Completo · 50 preguntas</h2>
          <div className="spacer-sm" />
          <TealButton onClick={() => startFullMock(premium)}>EMPEZAR EXAMEN COMPLETO</TealButton>
        </AppCard>
        <AppCard stacked onClick={() => startDailyQuiz(premium, quizDay, today)}>
          <p className="card-text t-body-medium">Quiz Diario Rápido · 5 preguntas (gratis)</p>
        </AppCard>
      </div>
    </div>
  )
}

/** Premium status line for Perfil. */
function premiumText(e: Entitlement): string {
  switch (e.status) {
    case 'lifetime':
      return 'Activa ✓ (de por vida)'
    case 'monthly':
      return e.inGrace ? `Vencida el ${formatDayEs(e.expires)} — renueva pronto` : `Activa ✓ hasta el ${formatDayEs(e.expires)}`
    case 'expired':
      return 'Vencida'
    default:
      return 'Bloqueada'
  }
}

/** "Perfil": mock trend chart + stats. */
export function PerfilScreen() {
  const { answers, mocks, userName } = useAppState()
  const { entitlement } = useEntitlement()
  const pass = passProbabilityPct(answers, QUESTIONS)
  const pcts = mocks.map((m) => scorePct(m.correct, m.total))
  const best = pcts.length ? Math.max(...pcts) : 0
  const email = entitlement.status === 'free' ? null : entitlement.email

  return (
    <div className="screen-enter">
      <GradientHeader title="Perfil" subtitle={userName || 'Estudiante'} />
      <div className="screen-body">
        <AppCard stacked>
          <p className="stat-label t-body-small">Tendencia de Exámenes</p>
          <div className="spacer-sm" />
          {mocks.length >= 2 ? (
            <>
              <TrendChart scores={[...mocks].sort((a, b) => a.at - b.at).map((m) => scorePct(m.correct, m.total))} />
              <div className="spacer-xs" />
              <p className="trend-legend t-label-small">– – meta de aprobación: 80%</p>
            </>
          ) : (
            <p className="card-text t-body-medium">Completa al menos 2 exámenes para ver tu tendencia.</p>
          )}
        </AppCard>
        <Stat label="Probabilidad de aprobar" value={`${pass}%`} />
        <Stat label="Preguntas respondidas" value={`${Object.keys(answers).length}`} />
        <Stat label="Exámenes completados" value={`${mocks.length}`} />
        <Stat label="Mejor puntaje" value={mocks.length ? `${best}%` : '—'} />
        <Stat label="Versión completa" value={premiumText(entitlement)} />
        {email && <Stat label="Correo de Premium" value={email} />}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <AppCard stacked>
      <p className="stat-label t-body-small">{label}</p>
      <p className="stat-value t-headline-small" style={{ overflowWrap: 'anywhere' }}>
        {value}
      </p>
    </AppCard>
  )
}
