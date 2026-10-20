/**
 * OnboardingScreen.tsx — first-run screen: value proposition + optional name.
 * Port of ui/onboarding/OnboardingScreen.kt (deliberately ONE screen — every extra step costs users).
 * Shown by App.tsx while `userName === null`; "Continuar sin nombre" saves '' (skipped).
 */
import { useState, type FormEvent } from 'react'
import { TealButton, TextLink } from '../components/core'
import { setUserName } from '../../store/appStore'
import './screens.css'

const BENEFITS = [
  'Practica el examen de la Florida en inglés, explicado en español',
  'Aprende a reconocer las palabras clave del examen real',
  'Mide tu progreso y tu probabilidad de aprobar',
]

/** First-run onboarding. */
export function OnboardingScreen() {
  const [name, setName] = useState('')
  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    setUserName(name)
  }
  return (
    <main className="onboarding screen-enter">
      <h1 className="t-display-medium">FL DMV</h1>
      <p className="onboarding__subtitle t-title-medium">Academia de Manejo</p>
      <div className="spacer-xxl" />
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {BENEFITS.map((b) => (
          <li key={b} className="onboarding__benefit">
            <span className="onboarding__check" aria-hidden="true">
              ✓
            </span>
            <span className="t-body-large">{b}</span>
          </li>
        ))}
      </ul>
      <div className="spacer-xxl" />
      <form onSubmit={submit}>
        <label htmlFor="name" className="t-title-medium">
          ¿Cómo te llamas?
        </label>
        <div className="spacer-sm" />
        <input
          id="name"
          className="onboarding__input"
          value={name}
          maxLength={24}
          autoComplete="given-name"
          autoCapitalize="words"
          enterKeyHint="done"
          placeholder="Tu nombre"
          onChange={(e) => setName(e.target.value)}
        />
        <div className="spacer-xl" />
        <TealButton type="submit" onClick={() => undefined}>
          EMPEZAR
        </TealButton>
      </form>
      <TextLink block color="var(--on-header-67)" onClick={() => setUserName('')}>
        Continuar sin nombre
      </TextLink>
    </main>
  )
}
