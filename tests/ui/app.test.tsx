/**
 * End-to-end-ish UI tests (React Testing Library + jsdom) for the main user journeys:
 * onboarding, free-tier gating, paywall email, activation with a real signed code, exams,
 * and the Spanish-chrome rule. The app's public key is swapped for a test key pair.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'

const keys = vi.hoisted(() => ({ sk: null as unknown as Uint8Array, pk: null as unknown as Uint8Array }))

vi.mock('../../src/config/unlockPublicKey', async () => {
  const mod = await import('../../src/billing/unlockCode')
  keys.sk = mod.generateSecretKey()
  keys.pk = mod.publicKeyFor(keys.sk)
  return { UNLOCK_PUBLIC_KEY: keys.pk, UNLOCK_PUBLIC_KEY_HEX: mod.toHex(keys.pk) }
})

import App from '../../src/App'
import { __setStateForTests, getState, type AppState } from '../../src/store/appStore'
import { createUnlockCode } from '../../src/billing/unlockCode'
import { addDays, dayKey } from '../../src/domain/dates'
import { paymentEmailHref } from '../../src/ui/screens/paymentEmail'
import { markRoot } from '../../src/ui/router'

function go(path: string) {
  act(() => {
    window.location.hash = path
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

function start(state: Partial<AppState>, path = '/home') {
  __setStateForTests({ userName: 'Ana', installDismissed: true, ...state })
  window.history.replaceState(null, '', `#${path}`)
  markRoot()
  return render(<App />)
}

beforeEach(() => {
  __setStateForTests({})
})

describe('onboarding', () => {
  it('captures the name and shows the greeting', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('¿Cómo te llamas?'), { target: { value: 'María' } })
    fireEvent.click(screen.getByRole('button', { name: 'EMPEZAR' }))
    expect(screen.getByRole('heading', { name: '¡Hola, María!' })).toBeInTheDocument()
    expect(getState().userName).toBe('María')
  })

  it('can be skipped', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Continuar sin nombre' }))
    expect(screen.getByRole('heading', { name: '¡Hola!' })).toBeInTheDocument()
  })
})

describe('free tier', () => {
  it('shows the remaining free questions and counts answers', () => {
    start({}, '/study/SENALES')
    expect(screen.getByText('Pregunta 1 · 5 gratis hoy')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: /./ }).find((b) => b.classList.contains('choice'))!)
    expect(screen.getByRole('status')).toHaveTextContent(/Correcto|Incorrecto/)
    expect(getState().freeCount).toBe(1)
  })

  it('sends a free user with no questions left to the paywall', () => {
    start({ freeDay: dayKey(), freeCount: 5 }, '/study/REGLAS')
    expect(screen.getByRole('heading', { name: 'Desbloquea todo' })).toBeInTheDocument()
  })

  it('locks the Full Mock for free users', async () => {
    start({}, '/exams')
    fireEvent.click(screen.getByRole('button', { name: 'EMPEZAR EXAMEN COMPLETO' }))
    expect(await screen.findByRole('heading', { name: 'Desbloquea todo' })).toBeInTheDocument()
  })

  it('allows one daily quiz per day', async () => {
    start({ quizDay: dayKey() }, '/exams')
    fireEvent.click(screen.getByText('Quiz Diario Rápido · 5 preguntas (gratis)'))
    expect(await screen.findByRole('heading', { name: 'Desbloquea todo' })).toBeInTheDocument()
  })
})

describe('paywall', () => {
  it('builds a pre-filled payment email for the chosen plan', () => {
    const href = paymentEmailHref('lifetime')
    expect(href.startsWith('mailto:bitensemble.solutions@gmail.com?subject=')).toBe(true)
    expect(decodeURIComponent(href)).toContain('De por vida (US$99.99, pago único)')
    expect(decodeURIComponent(paymentEmailHref('monthly'))).toContain('Mensual (US$34.99 / mes)')
  })

  it('shows both plans with prices', () => {
    start({}, '/paywall')
    expect(screen.getByRole('radio', { name: /Mensual/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('US$34.99')).toBeInTheDocument()
    expect(screen.getByText('US$99.99')).toBeInTheDocument()
  })
})

describe('activation', () => {
  const email = 'ana@example.com'

  function activate(code: string, mail = email) {
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: mail } })
    fireEvent.change(screen.getByLabelText('Código de activación'), { target: { value: code } })
    fireEvent.click(screen.getByRole('button', { name: 'ACTIVAR' }))
  }

  it('a valid lifetime code unlocks Premium', async () => {
    start({}, '/activate')
    activate(createUnlockCode({ email, plan: 'lifetime', issued: dayKey() }, keys.sk))
    expect(getState().unlock?.email).toBe(email)
    go('/profile')
    expect(screen.getByText('Activa ✓ (de por vida)')).toBeInTheDocument()
    go('/exams')
    fireEvent.click(screen.getByRole('button', { name: 'EMPEZAR EXAMEN COMPLETO' }))
    expect(await screen.findByText('Pregunta 1 de 50')).toBeInTheDocument()
  })

  it('rejects a code for another email, a tampered code and an expired code', () => {
    start({}, '/activate')
    const good = createUnlockCode({ email, plan: 'lifetime', issued: dayKey() }, keys.sk)
    activate(good, 'otra@example.com')
    expect(screen.getByRole('alert')).toHaveTextContent('no corresponde a ese correo')
    const i = 8
    activate(good.slice(0, i) + (good[i] === 'A' ? 'B' : 'A') + good.slice(i + 1))
    expect(screen.getByRole('alert')).toHaveTextContent('no es válido')
    const old = createUnlockCode(
      { email, plan: 'monthly', issued: addDays(dayKey(), -60), expires: addDays(dayKey(), -30) },
      keys.sk,
    )
    activate(old)
    expect(screen.getByRole('alert')).toHaveTextContent('venció')
    expect(getState().unlock).toBeNull()
  })

  it('an expired monthly code re-locks Premium and shows the notice', async () => {
    const code = createUnlockCode(
      { email, plan: 'monthly', issued: addDays(dayKey(), -40), expires: addDays(dayKey(), -10) },
      keys.sk,
    )
    start({ unlock: { email, code } }, '/home')
    expect(screen.getByText('Tu acceso Premium terminó')).toBeInTheDocument()
    go('/exams')
    fireEvent.click(screen.getByRole('button', { name: 'EMPEZAR EXAMEN COMPLETO' }))
    expect(await screen.findByRole('heading', { name: 'Desbloquea todo' })).toBeInTheDocument()
  })

  it('a monthly code near expiry shows the renewal reminder', () => {
    const code = createUnlockCode(
      { email, plan: 'monthly', issued: addDays(dayKey(), -28), expires: addDays(dayKey(), 2) },
      keys.sk,
    )
    start({ unlock: { email, code } }, '/home')
    expect(screen.getByText('Tu acceso Premium vence pronto')).toBeInTheDocument()
  })
})

describe('daily quiz', () => {
  it('runs 5 questions, shows results and marks the free quiz as used', () => {
    start({}, '/exam/5')
    for (let n = 1; n <= 5; n++) {
      expect(screen.getByText(`Pregunta ${n} de 5`)).toBeInTheDocument()
      fireEvent.click(screen.getAllByRole('radio')[0])
      fireEvent.click(screen.getByRole('button', { name: n === 5 ? 'Terminar' : 'Siguiente' }))
    }
    expect(screen.getByText(/de 5 correctas/)).toBeInTheDocument()
    expect(getState().quizDay).toBe(dayKey())
    expect(getState().freeCount).toBe(0) // quiz answers never use the study allowance
  })
})

describe('Spanish chrome rule', () => {
  it('main screens contain no common English UI words', () => {
    const banned = /\b(Home|Settings|Profile|Submit|Next|Back|Continue|Score|Unlock|Install|Cancel|Loading)\b/
    for (const path of ['/home', '/topics', '/exams', '/profile', '/settings', '/paywall', '/activate', '/install']) {
      const { container, unmount } = start({}, path)
      // Question text is English on purpose; screens above contain none.
      expect(container.textContent ?? '').not.toMatch(banned)
      unmount()
    }
  })
})
