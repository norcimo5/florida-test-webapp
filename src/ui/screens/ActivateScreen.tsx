/**
 * ActivateScreen.tsx — "Activar Premium": the buyer types their email and pastes the code the
 * owner emailed them. The code is verified offline (billing/unlockCode.ts); a valid one is saved
 * (store/appStore.ts saveUnlock) and Premium turns on immediately. Renewing a monthly plan = enter
 * the new code here; it replaces the old one.
 */
import { useState, type FormEvent } from 'react'
import { verifyUnlockCode, looksLikeEmail } from '../../billing/unlockCode'
import { REJECT_MESSAGES } from './activationMessages'
import { entitlementFor, isPremium, type Entitlement } from '../../billing/entitlement'
import { UNLOCK_PUBLIC_KEY } from '../../config/unlockPublicKey'
import { CONTACT_EMAIL } from '../../config/app'
import { formatDayEs } from '../../domain/dates'
import { saveUnlock, useAppState } from '../../store/appStore'
import { useEntitlement } from '../../store/useEntitlement'
import { goHome } from '../router'
import { showSnackbar } from '../components/snackbar'
import { GradientHeader, TealButton, TextLink, Disclaimer } from '../components/core'
import './screens.css'


/**
 * Why a newly entered (valid) code should NOT replace the saved one, or null if it may.
 * Protects a lifetime user from downgrading and a monthly user from losing days by re-entering an
 * older code.
 */
function worseThanCurrent(current: Entitlement, next: Entitlement): string | null {
  if (current.status === 'lifetime' && next.status !== 'lifetime') {
    return 'Ya tienes Premium de por vida en este teléfono. No necesitas otro código.'
  }
  if (current.status === 'monthly' && next.status === 'monthly' && next.expires < current.expires) {
    return `Tu código actual dura más (hasta el ${formatDayEs(current.expires)}). Lo dejamos activo.`
  }
  return null
}

/** Premium activation form. */
export function ActivateScreen() {
  const { unlock } = useAppState()
  const { today, entitlement } = useEntitlement()
  const [email, setEmail] = useState(unlock?.email ?? '')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!looksLikeEmail(email)) return setError('Escribe un correo válido, por ejemplo nombre@gmail.com.')
    if (!code.trim()) return setError('Pega el código que te enviamos por correo.')
    const res = verifyUnlockCode(code, email, UNLOCK_PUBLIC_KEY)
    if (!res.ok) return setError(REJECT_MESSAGES[res.reason])
    const ent = entitlementFor(res.plan, res.expires, email, today)
    if (!isPremium(ent)) {
      return setError(`Este código venció el ${formatDayEs(res.expires!)}. Pide un código nuevo a ${CONTACT_EMAIL}.`)
    }
    const worse = worseThanCurrent(entitlement, ent)
    if (worse) return setError(worse)
    saveUnlock({ email, code })
    showSnackbar(
      res.plan === 'lifetime'
        ? '¡Premium activado de por vida!'
        : `¡Premium activado hasta el ${formatDayEs(res.expires!)}!`,
    )
    goHome()
  }

  return (
    <div className="screen-enter">
      <GradientHeader title="Activar Premium" subtitle="Escribe tu correo y el código que te enviamos" />
      <form className="screen-body" onSubmit={submit} noValidate>
        <label htmlFor="act-email" className="field-label t-label-medium">
          Correo electrónico
        </label>
        <input
          id="act-email"
          className="text-field"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="nombre@gmail.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(null)
          }}
        />
        <div className="spacer-lg" />
        <label htmlFor="act-code" className="field-label t-label-medium">
          Código de activación
        </label>
        <textarea
          id="act-code"
          className="text-field text-field--code"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="FLDMV-…"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(null)
          }}
        />
        {error && (
          <p className="field-error t-body-medium" role="alert">
            {error}
          </p>
        )}
        <div className="spacer-xl" />
        <TealButton type="submit" onClick={() => undefined}>
          ACTIVAR
        </TealButton>
        <div className="spacer-sm" />
        <TextLink block onClick={() => (window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Ayuda con mi código Premium')}`)}>
          ¿No recibiste tu código? Escríbenos
        </TextLink>
        <TextLink block color="var(--gray-500)" onClick={goHome}>
          Volver
        </TextLink>
        <div className="spacer-sm" />
        <Disclaimer />
      </form>
    </div>
  )
}
