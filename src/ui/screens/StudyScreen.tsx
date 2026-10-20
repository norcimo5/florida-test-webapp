/**
 * StudyScreen.tsx — study one topic, question by question. Port of ui/study/StudyScreen.kt:
 * English question with the exam keywords highlighted, optional Spanish translation,
 * instant right/wrong feedback (color + icon), "¿POR QUÉ?" explanation, free-tier gate.
 *
 * Free tier: each answer here counts toward the 5-per-day allowance. When it's used up, the user
 * is sent to the paywall (replacing this screen, so "Ahora no" returns to where they came from
 * instead of bouncing back here).
 */
import { useEffect, useMemo, useState } from 'react'
import { macroTopicOf, TOPIC_LABELS, type MacroTopic } from '../../domain/macroTopic'
import { freeLeftToday, studyAllowed, countForDay } from '../../domain/gating'
import { QUESTIONS, shuffled } from '../../data/questions'
import { recordAnswer, useAppState } from '../../store/appStore'
import { useEntitlement } from '../../store/useEntitlement'
import { goBack, navigate } from '../router'
import { Icon } from '../icons'
import { GradientHeader, TealButton, TextLink } from '../components/core'
import { highlightKeywords } from './highlight'
import './screens.css'

/** Study screen for `topic`. */
export function StudyScreen({ topic }: { topic: MacroTopic }) {
  const pool = useMemo(() => shuffled(QUESTIONS.filter((q) => macroTopicOf(q.category) === topic)), [topic])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [showEs, setShowEs] = useState(false)
  const { freeDay, freeCount } = useAppState()
  const { premium, today } = useEntitlement()
  const answeredToday = countForDay(freeDay, freeCount, today)
  const q = pool[idx % pool.length]

  // Out of free questions and not mid-question → paywall (Android LaunchedEffect equivalent).
  useEffect(() => {
    if (picked === null && !studyAllowed(premium, answeredToday)) navigate('/paywall', { replace: true })
  }, [picked, premium, answeredToday])

  const choose = (i: number) => {
    if (picked !== null) return
    navigator.vibrate?.(10) // light haptic like Android's performHapticFeedback (ignored on iOS)
    setPicked(i)
    recordAnswer(q.id, i === q.en.correct, { countsTowardDailyCap: true, premium, today })
  }

  const next = () => {
    if (!studyAllowed(premium, answeredToday)) {
      navigate('/paywall', { replace: true })
      return
    }
    setPicked(null)
    setShowEs(false)
    setIdx((n) => n + 1)
    window.scrollTo(0, 0)
  }

  const subtitle = premium
    ? `Pregunta ${idx + 1}`
    : `Pregunta ${idx + 1} · ${freeLeftToday(answeredToday)} gratis hoy`
  const revealed = picked !== null
  const isRight = picked === q.en.correct

  return (
    <div className="screen-enter">
      <GradientHeader title="Estudiar" subtitle={subtitle} />
      <div className="screen-body">
        <p className="sr-only">Tema: {TOPIC_LABELS[topic]}</p>
        <p className="question-text t-body-large" lang="en">
          {highlightKeywords(q.en.question, q.keywords.map((k) => k.en))}
        </p>
        {showEs && q.es && <p className="question-es t-body-medium">{q.es.question}</p>}

        <ul className="choices" aria-label="Respuestas">
          {q.en.choices.map((choice, i) => {
            const isCorrect = i === q.en.correct
            const isPicked = picked === i
            const cls = !revealed ? '' : isCorrect ? ' choice--correct' : isPicked ? ' choice--incorrect' : ''
            return (
              <li key={i}>
                <button type="button" className={`choice${cls}`} disabled={revealed} onClick={() => choose(i)} lang="en">
                  <span className="choice__text t-body-medium">{choice}</span>
                  {revealed && (isCorrect || isPicked) && (
                    <Icon
                      name={isCorrect ? 'checkCircle' : 'cancel'}
                      size={22}
                      color={isCorrect ? 'var(--success)' : 'var(--error)'}
                      label={isCorrect ? 'Respuesta correcta' : 'Respuesta incorrecta'}
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {revealed && (
          <>
            <p className={`feedback t-title-medium ${isRight ? 'feedback--ok' : 'feedback--bad'}`} role="status">
              {isRight ? '¡Correcto!' : 'Incorrecto'}
            </p>
            {q.explanation && (
              <div className="why-box">
                <p className="why-box__title t-label-medium">¿POR QUÉ?</p>
                <p className="why-box__text t-body-medium">{q.explanation}</p>
              </div>
            )}
            <div className="spacer-lg" />
            <TealButton onClick={next}>Siguiente</TealButton>
          </>
        )}

        <div className="spacer-xs" />
        <div>
          <TextLink onClick={() => setShowEs((v) => !v)}>{showEs ? 'Ocultar español' : 'Ver en español'}</TextLink>
        </div>
        <div>
          <TextLink color="var(--gray-500)" onClick={goBack}>
            Volver
          </TextLink>
        </div>
      </div>
    </div>
  )
}
