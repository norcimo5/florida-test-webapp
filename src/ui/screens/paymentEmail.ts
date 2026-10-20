/**
 * paymentEmail.ts — builds the pre-filled "send payment proof" email the paywall opens.
 * Recipient and prices come from src/config/app.ts; payment methods from src/config/payment.ts.
 */
import { CONTACT_EMAIL, PRICES } from '../../config/app'
import { activePaymentMethods } from '../../config/payment'
import type { Plan } from '../../billing/unlockCode'

/** Builds the mailto: link for the payment-proof email for the chosen plan. */
export function paymentEmailHref(plan: Plan): string {
  const planEs = plan === 'monthly' ? `Mensual (${PRICES.monthly} / mes)` : `De por vida (${PRICES.lifetime}, pago único)`
  const methods = activePaymentMethods().map((m) => m.name)
  const subject = `Quiero Premium – ${plan === 'monthly' ? 'Plan mensual' : 'De por vida'}`
  const body = [
    'Hola,',
    '',
    'Quiero activar Premium en Examen de Manejo Florida.',
    '',
    `Plan: ${planEs}`,
    `Pagué por: ${methods.length ? methods.join(' / ') : '(todavía no he pagado, envíenme los datos de pago)'}`,
    'Nombre que aparece en el pago: ',
    '',
    'Adjunto la captura de mi pago. Envíen el código a este mismo correo.',
    '',
    'Gracias.',
  ].join('\n')
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
