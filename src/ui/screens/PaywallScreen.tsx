/**
 * PaywallScreen.tsx — "Desbloquea todo". Same look as the Android ui/paywall/PaywallScreen.kt
 * (benefits list + two selectable plan cards), but payment is manual (no app store):
 *
 *   1. buyer pays by Zelle / Cash App / PayPal (handles in src/config/payment.ts),
 *   2. taps "ENVIAR COMPROBANTE" → their email app opens a pre-filled message to CONTACT_EMAIL,
 *   3. the owner replies with an unlock code (tools/make-unlock-code.ts),
 *   4. buyer enters it in "Ya tengo un código" (ActivateScreen).
 *
 * Lifetime users never see this (it closes itself, like Android). Monthly users can open it to renew.
 */
import { useEffect, useState } from 'react'
import { CONTACT_EMAIL, MONTHLY_DAYS, PRICES } from '../../config/app'
import { paymentEmailHref } from './paymentEmail'
import { activePaymentMethods } from '../../config/payment'
import { useEntitlement } from '../../store/useEntitlement'
import type { Plan } from '../../billing/unlockCode'
import { goBack, navigate } from '../router'
import { AppCard, Disclaimer, GradientHeader, TealButton, TextLink } from '../components/core'
import './screens.css'

const BENEFITS = [
  '120 preguntas de práctica completas',
  'Examen Completo de 50 preguntas (como el real)',
  'Preguntas ilimitadas cada día',
  'Análisis de progreso y probabilidad de aprobar',
  'Repaso ilimitado de tus errores',
]


/** Premium purchase screen. */
export function PaywallScreen() {
  const { entitlement } = useEntitlement()
  const [plan, setPlan] = useState<Plan>('monthly')
  const methods = activePaymentMethods()
  const price = plan === 'monthly' ? PRICES.monthly : PRICES.lifetime

  // Already lifetime Premium → nothing to buy (Android: LaunchedEffect(entitled) { onClose() }).
  useEffect(() => {
    if (entitlement.status === 'lifetime') goBack()
  }, [entitlement.status])

  return (
    <div className="screen-enter">
      <GradientHeader title="Desbloquea todo" subtitle="Preparación completa para tu examen" />
      <div className="screen-body">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {BENEFITS.map((b) => (
            <li key={b} className="benefit t-body-medium">
              <span className="benefit__check" aria-hidden="true">
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>

        <div className="spacer-lg" />
        <div role="radiogroup" aria-label="Elige tu plan">
          <PlanCard
            title="Mensual"
            price={PRICES.monthly}
            period="/ mes"
            note={`${MONTHLY_DAYS} días de acceso · sin renovación automática`}
            badge="MÁS POPULAR"
            selected={plan === 'monthly'}
            onSelect={() => setPlan('monthly')}
          />
          <div className="spacer-md" />
          <PlanCard
            title="De por vida"
            price={PRICES.lifetime}
            period="pago único"
            note="Acceso para siempre, sin renovaciones"
            selected={plan === 'lifetime'}
            onSelect={() => setPlan('lifetime')}
          />
        </div>

        <div className="spacer-lg" />
        <AppCard>
          <h2 className="card-title t-title-medium">Cómo pagar</h2>
          <ol className="steps t-body-medium">
            {methods.length > 0 ? (
              <li>
                Envía <strong>{price}</strong> por:
                {methods.map((m) => (
                  <span key={m.name} className="pay-method">
                    <span>{m.name}</span>
                    <span className="pay-method__handle">{m.handle}</span>
                  </span>
                ))}
              </li>
            ) : (
              <li>Toca el botón de abajo y te enviaremos por correo cómo pagar {price}.</li>
            )}
            <li>
              {methods.length > 0
                ? 'Toca «Enviar comprobante» y adjunta una captura de tu pago.'
                : 'Haz el pago con los datos que te enviemos.'}
            </li>
            <li>Te enviaremos tu código de activación por correo, normalmente el mismo día.</li>
            <li>Toca «Ya tengo un código» y pégalo. ¡Listo!</li>
          </ol>
        </AppCard>

        <div className="spacer-xl" />
        <TealButton onClick={() => (window.location.href = paymentEmailHref(plan))}>
          {methods.length > 0 ? 'ENVIAR COMPROBANTE' : 'SOLICITAR ACCESO'}
        </TealButton>
        <div className="spacer-sm" />
        <TextLink block onClick={() => navigate('/activate', { replace: true })}>
          Ya tengo un código
        </TextLink>
        <TextLink block color="var(--gray-500)" onClick={goBack}>
          Ahora no
        </TextLink>

        <div className="spacer-sm" />
        <p className="disclaimer t-label-small">
          El plan mensual da {MONTHLY_DAYS} días de acceso y no se renueva automáticamente: para continuar,
          vuelve a pagar y te enviaremos un código nuevo (los días se suman, no se pierden). El plan de por vida
          es un pago único, sin renovaciones. Tu código queda ligado a tu correo. ¿Preguntas? Escríbenos a{' '}
          {CONTACT_EMAIL}.
        </p>
        <div className="spacer-xs" />
        <Disclaimer />
        <div className="spacer-xl" />
      </div>
    </div>
  )
}

interface PlanCardProps {
  title: string
  price: string
  period: string
  note: string
  badge?: string
  selected: boolean
  onSelect: () => void
}

/** Selectable plan card (Android PlanCard). */
function PlanCard({ title, price, period, note, badge, selected, onSelect }: PlanCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`plan-card${selected ? ' plan-card--selected' : ''}`}
      onClick={onSelect}
    >
      {badge && <span className="plan-card__badge t-label-small">{badge}</span>}
      <span className="plan-card__top">
        <span className="card-title t-title-medium">{title}</span>
        <span className="plan-card__price">
          <span className="t-headline-small">{price}</span>
          <span className="plan-card__period t-label-medium">{period}</span>
        </span>
      </span>
      <span className="plan-card__note t-body-small" style={{ display: 'block' }}>
        {note}
      </span>
    </button>
  )
}
