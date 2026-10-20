/**
 * ExamScreens.tsx — the exam engine and its results page.
 *   ExamScreen     port of ui/exam/ExamScreen.kt — Full Mock (50) and Daily Quiz (5): English only,
 *                  no hints, no explanations (real-exam simulation), radio-style selection.
 *   ResultsScreen  port of ui/exam/ResultsScreen.kt — big %, pass/fail at 80%.
 *
 * The gate is checked here too (not only on the buttons), so typing #/exam/50 in the address bar
 * can't open a Premium exam. It is evaluated once, on entry: finishing the free quiz marks it used,
 * and that must not bounce the user to the paywall on the way to their results.
 *
 * Exam answers update mastery but never use the free study allowance. Finishing a mock saves it to
 * history; finishing a quiz marks today's free quiz as used. Results REPLACE the exam in history,
 * so Back from results goes to where the exam was started, not into a finished exam.
 */
import { useEffect, useMemo, useState } from 'react'
import { sampleExam } from '../../data/questions'
import { FULL_MOCK_LENGTH, passed, scorePct } from '../../domain/metrics'
import { markDailyQuiz, recordAnswer, recordMock, useAppState } from '../../store/appStore'
import { dailyQuizAllowed, fullMockAllowed } from '../../domain/gating'
import { useEntitlement } from '../../store/useEntitlement'
import { goHome, navigate } from '../router'
import { Icon } from '../icons'
import { AppCard, GradientHeader, TealButton } from '../components/core'
import './screens.css'

/** Exam with `count` random questions (50 = Examen Completo, otherwise Quiz Diario). */
export function ExamScreen({ count }: { count: number }) {
  const pool = useMemo(() => sampleExam(count), [count])
  const [idx, setIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const { premium, today } = useEntitlement()
  const { quizDay } = useAppState()
  const isMock = count >= FULL_MOCK_LENGTH
  const [allowed] = useState(() => (isMock ? fullMockAllowed(premium) : dailyQuizAllowed(premium, quizDay, today)))
  useEffect(() => {
    if (!allowed) navigate('/paywall', { replace: true })
  }, [allowed])
  const q = pool[idx]
  const last = idx + 1 === pool.length

  const submit = () => {
    if (picked === null) return
    const right = picked === q.en.correct
    const total = right ? correct + 1 : correct
    recordAnswer(q.id, right, { countsTowardDailyCap: false, premium, today })
    if (last) {
      if (isMock) recordMock(total, pool.length)
      else markDailyQuiz(today)
      navigate(`/results/${total}/${pool.length}`, { replace: true })
    } else {
      setCorrect(total)
      setIdx(idx + 1)
      setPicked(null)
      window.scrollTo(0, 0)
    }
  }

  if (!allowed) return null

  return (
    <div className="screen-enter">
      <GradientHeader
        title={isMock ? 'Examen Completo' : 'Quiz Diario Rápido'}
        subtitle={`Pregunta ${idx + 1} de ${pool.length}`}
      />
      <div className="screen-body">
        <p className="question-text t-body-large" lang="en">
          {q.en.question}
        </p>
        <div className="choices" role="radiogroup" aria-label="Respuestas">
          {q.en.choices.map((choice, i) => {
            const selected = picked === i
            return (
              <button
                key={`${q.id}-${i}`}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`choice${selected ? ' choice--selected' : ''}`}
                onClick={() => {
                  navigator.vibrate?.(10)
                  setPicked(i)
                }}
                lang="en"
              >
                <Icon
                  name={selected ? 'radioChecked' : 'radioUnchecked'}
                  size={20}
                  color={selected ? 'var(--brand-blue)' : 'var(--gray-400)'}
                />
                <span className="choice__text t-body-medium">{choice}</span>
              </button>
            )
          })}
        </div>
        <div className="spacer-xl" />
        {/* Like Android, the button never looks disabled; it just ignores taps until an answer is picked. */}
        <TealButton onClick={submit}>
          {last ? 'Terminar' : 'Siguiente'}
        </TealButton>
        {picked === null && <p className="hint t-label-small">Selecciona una respuesta para continuar</p>}
      </div>
    </div>
  )
}

/** Results for a finished exam. */
export function ResultsScreen({ correct, total }: { correct: number; total: number }) {
  const pct = scorePct(correct, total)
  const ok = passed(correct, total)
  return (
    <div className="screen-enter">
      <GradientHeader
        title={ok ? '¡Aprobado! 🎯' : 'Sigue practicando'}
        subtitle={total >= FULL_MOCK_LENGTH ? 'Examen Completo · necesitas 80% (40/50)' : 'Quiz Diario Rápido'}
      />
      <div className="screen-body">
        <AppCard>
          <p className={`t-display-medium ${ok ? 'result-pct--pass' : 'result-pct--fail'}`}>{pct}%</p>
          <p className="card-text t-body-medium">
            {correct} de {total} correctas
          </p>
          <div className="spacer-sm" />
          <p className="card-meta t-body-medium">
            {ok ? 'Estás listo/a para el examen real.' : 'Repasa los temas más débiles y vuelve a intentarlo.'}
          </p>
        </AppCard>
        <div className="spacer-xl" />
        <TealButton onClick={goHome}>Volver al Inicio</TealButton>
      </div>
    </div>
  )
}
