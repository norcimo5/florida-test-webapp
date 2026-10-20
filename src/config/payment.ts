/**
 * payment.ts — where buyers send money. EDIT THIS FILE to set or change your payment handles.
 *
 * Fill in any of the three (leave '' to hide that option). If all three are empty, the paywall
 * tells buyers "we'll email you the payment details" and they just send the request email.
 * After editing: `npm run deploy` (docs/DEPLOY.md).
 */

/** One way to pay, as shown on the paywall. */
export interface PaymentMethod {
  /** Name shown to the buyer (brand names stay as-is). */
  name: string
  /** Your handle / phone / email / link for this service. '' = hidden. */
  handle: string
}

/** Payment options in display order. */
export const PAYMENT_METHODS: PaymentMethod[] = [
  { name: 'Zelle', handle: '' },     // e.g. 'bitensemble.solutions@gmail.com' or a phone number
  { name: 'Cash App', handle: '' },  // e.g. '$BitEnsemble'
  { name: 'PayPal', handle: '' },    // e.g. 'paypal.me/bitensemble'
]

/** Only the methods that have a handle filled in. */
export function activePaymentMethods(): PaymentMethod[] {
  return PAYMENT_METHODS.filter((m) => m.handle.trim() !== '')
}
