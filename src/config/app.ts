/**
 * app.ts — business settings in one place: prices, contact email, links.
 *
 * Changing a price here updates the paywall and the payment email. Also update the store/landing
 * copy if you mention prices anywhere else (docs/UPGRADING.md → "Changing prices").
 */

/** Public support / payment-proof email (never use the owner's private address here). */
export const CONTACT_EMAIL = 'bitensemble.solutions@gmail.com'

/** Display prices (strings, shown as-is). */
export const PRICES = {
  monthly: 'US$34.99',
  lifetime: 'US$99.99',
} as const

/** Days of access a monthly payment buys (must match the CLI default `--days 30`). */
export const MONTHLY_DAYS = 30

/** Public address of the app (used in emails and the privacy policy). */
export const APP_URL = 'https://norcimo5.github.io/florida-test-webapp/'

/** Privacy policy (served from public/privacy-policy.html). */
export const PRIVACY_URL = `${APP_URL}privacy-policy.html`

/** App version shown in Ajustes — comes from package.json via vite.config.ts `define`. */
export const APP_VERSION: string = __APP_VERSION__
