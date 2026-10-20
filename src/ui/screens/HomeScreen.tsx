/**
 * HomeScreen.tsx — "Inicio" dashboard. Port of ui/home/HomeScreen.kt:
 * gradient header with greeting + shield + pass meter, 2-column topic grid, practice exams,
 * progress summary, disclaimer.
 *
 * Web-only additions (above the topic grid, only when relevant):
 *   - Premium renewal/expired notice (monthly plan, see billing/entitlement.ts)
 *   - "Instala la app" card until installed or dismissed (pwa/install.ts)
 */
import { MACRO_TOPICS, TOPIC_LABELS, type MacroTopic } from '../../domain/macroTopic'
import { passProbabilityPct, topicMasteryPct } from '../../domain/metrics'
import { QUESTIONS } from '../../data/questions'
import { dismissInstall, useAppState } from '../../store/appStore'
import { useEntitlement } from '../../store/useEntitlement'
import { useInstallMode } from '../../pwa/install'
import { formatDayEs } from '../../domain/dates'
import { navigate } from '../router'
import { Icon } from '../icons'
import {
  AppCard,
  Disclaimer,
  GradientHeader,
  HeroShield,
  MiniBar,
  PassMeter,
  SectionTitle,
  TealButton,
  TextLink,
  TopicIconChip,
} from '../components/core'
import { startDailyQuiz, startFullMock } from './examActions'
import './screens.css'

/** Inicio dashboard. */
export function HomeScreen() {
  const { answers, userName, quizDay, installDismissed } = useAppState()
  const { entitlement, premium, today } = useEntitlement()
  const installMode = useInstallMode()
  const pass = passProbabilityPct(answers, QUESTIONS)
  const greeting = userName ? `¡Hola, ${userName}!` : '¡Hola!'
  const answeredCount = Object.keys(answers).length

  return (
    <div className="screen-enter">
      <GradientHeader title={greeting} subtitle="FL DMV · Academia de Manejo" trailing={<HeroShield />}>
        <PassMeter pct={pass} />
      </GradientHeader>

      <div className="screen-body">
        {entitlement.status === 'monthly' && entitlement.remind && (
          <AppCard stacked className="notice notice--warn">
            <p className="card-title t-title-medium">
              {entitlement.inGrace ? 'Tu acceso Premium venció' : 'Tu acceso Premium vence pronto'}
            </p>
            <p className="card-text t-body-medium">
              {entitlement.inGrace
                ? `Venció el ${formatDayEs(entitlement.expires)}. Renueva en los próximos días para no perderlo.`
                : `Vence el ${formatDayEs(entitlement.expires)}. Renueva para seguir estudiando sin límites.`}
            </p>
            <div className="notice__actions">
              <TextLink onClick={() => navigate('/paywall')}>Renovar</TextLink>
              <TextLink onClick={() => navigate('/activate')}>Ya tengo un código nuevo</TextLink>
            </div>
          </AppCard>
        )}
        {entitlement.status === 'expired' && (
          <AppCard stacked className="notice notice--warn">
            <p className="card-title t-title-medium">Tu acceso Premium terminó</p>
            <p className="card-text t-body-medium">
              Terminó el {formatDayEs(entitlement.expires)}. Tu progreso sigue guardado.
            </p>
            <div className="notice__actions">
              <TextLink onClick={() => navigate('/paywall')}>Renovar</TextLink>
              <TextLink onClick={() => navigate('/activate')}>Ya tengo un código nuevo</TextLink>
            </div>
          </AppCard>
        )}
        {installMode !== 'installed' && !installDismissed && (
          <AppCard stacked className="notice">
            <div className="row">
              <Icon name="installMobile" size={28} color="var(--brand-teal-dark)" />
              <div className="grow">
                <p className="card-title t-title-medium">Instala la app</p>
                <p className="card-meta t-body-small">Ábrela desde tu pantalla de inicio, incluso sin internet.</p>
              </div>
            </div>
            <div className="notice__actions">
              <TextLink onClick={() => navigate('/install')}>Cómo instalar</TextLink>
              <TextLink color="var(--gray-500)" onClick={dismissInstall}>
                Ahora no
              </TextLink>
            </div>
          </AppCard>
        )}

        <SectionTitle>Estudiar y Practicar</SectionTitle>
        <div className="topic-grid">
          {MACRO_TOPICS.map((topic) => (
            <TopicCard key={topic} topic={topic} pct={topicMasteryPct(answers, QUESTIONS, topic)} />
          ))}
        </div>

        <div className="spacer-lg" />
        <div className="spacer-md" />
        <SectionTitle>Exámenes de Práctica</SectionTitle>
        <AppCard stacked>
          <div className="row row--tight">
            <h3 className="card-title t-title-medium">Examen Completo</h3>
            {!premium && <Icon name="lock" size={16} color="var(--brand-amber)" label="Bloqueado" />}
          </div>
          <p className="card-meta t-body-small">50 preguntas · 10–20 min</p>
          <div className="spacer-sm" />
          <TealButton onClick={() => startFullMock(premium)}>EMPEZAR EXAMEN COMPLETO</TealButton>
        </AppCard>
        <AppCard stacked onClick={() => startDailyQuiz(premium, quizDay, today)}>
          <h3 className="card-title t-title-medium">Quiz Diario Rápido</h3>
          <p className="card-meta t-body-small">5 preguntas mixtas · gratis</p>
        </AppCard>

        <div className="spacer-lg" />
        <SectionTitle>Mi Progreso</SectionTitle>
        <AppCard stacked>
          <p className="card-text t-body-medium">
            {answeredCount === 0
              ? 'Aún sin puntajes. ¡Empieza a practicar!'
              : `${answeredCount} preguntas respondidas · ${pass}% listo/a`}
          </p>
        </AppCard>

        <div className="spacer-xl" />
        <Disclaimer />
        <div className="spacer-xl" />
      </div>
    </div>
  )
}

/** One cell of the 2-column topic grid: chip, name, mastery % and bar. */
function TopicCard({ topic, pct }: { topic: MacroTopic; pct: number }) {
  return (
    <AppCard onClick={() => navigate(`/study/${topic}`)} ariaLabel={`${TOPIC_LABELS[topic]}, ${pct}% dominado`}>
      <TopicIconChip topic={topic} />
      <p className="topic-card__label t-body-medium w-medium">{TOPIC_LABELS[topic]}</p>
      <p className="topic-card__pct t-title-medium">{pct}%</p>
      <MiniBar pct={pct} />
    </AppCard>
  )
}
