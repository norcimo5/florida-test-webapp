/**
 * activationMessages.ts — Spanish error text for rejected unlock codes (ActivateScreen).
 * Keys are the RejectReason values from billing/unlockCode.ts.
 */
import type { RejectReason } from '../../billing/unlockCode'

/** Spanish message for each rejection reason (exported for tests/docs). */
export const REJECT_MESSAGES: Record<RejectReason, string> = {
  format: 'El código está incompleto o tiene un error. Cópialo y pégalo completo desde el correo.',
  version: 'Este código necesita una versión más nueva de la app. Ciérrala, ábrela de nuevo e inténtalo otra vez.',
  signature: 'Este código no es válido. Revisa que lo copiaste completo, sin cambiar ninguna letra.',
  email: 'Este código no corresponde a ese correo. Escribe el mismo correo al que te enviamos el código.',
}
