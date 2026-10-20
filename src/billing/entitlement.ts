/**
 * entitlement.ts — "is this user Premium right now?" — the ONLY place that answers it.
 *
 * Input: the unlock record saved on the device (email + code) and today's day key.
 * The code is re-verified on every app start, so editing localStorage by hand can't forge a plan
 * or extend an expiry (accepted residual risk: someone could still patch the JavaScript itself).
 *
 * Monthly timing (constants below):
 *   - access through the code's `expires` day (inclusive),
 *   - then GRACE_DAYS more days of access, with a "renew" reminder,
 *   - the reminder starts REMIND_DAYS before `expires`,
 *   - after the grace period the app re-locks to the free tier (progress is kept).
 */
import { dayNumber } from '../domain/dates'
import { UNLOCK_PUBLIC_KEY } from '../config/unlockPublicKey'
import { verifyUnlockCode, type Plan } from './unlockCode'

/** Days of access after a monthly code's expiry day (payment-delay cushion). */
export const GRACE_DAYS = 3

/** Days before expiry when the renewal reminder starts. */
export const REMIND_DAYS = 3

/** What is saved on the device after a successful activation. */
export interface UnlockRecord {
  email: string
  code: string
}

/** Everything the UI needs to know about Premium. */
export type Entitlement =
  | { status: 'free' }
  | { status: 'lifetime'; email: string }
  | {
      status: 'monthly'
      email: string
      /** Last paid day (inclusive). */
      expires: string
      /** Days until `expires` (0 = last day; negative = in grace). */
      daysLeft: number
      /** True once the renewal reminder should show (near expiry or in grace). */
      remind: boolean
      /** True when past `expires` but still inside the grace period. */
      inGrace: boolean
    }
  | { status: 'expired'; email: string; expires: string }

/** True when the entitlement unlocks Premium features. */
export function isPremium(e: Entitlement): boolean {
  return e.status === 'lifetime' || e.status === 'monthly'
}

/**
 * Computes the user's entitlement. An invalid stored code (e.g. after a key rotation) is treated
 * as free rather than crashing.
 */
export function computeEntitlement(
  record: UnlockRecord | null,
  today: string,
  publicKey: Uint8Array = UNLOCK_PUBLIC_KEY,
): Entitlement {
  if (!record) return { status: 'free' }
  const res = verifyUnlockCode(record.code, record.email, publicKey)
  if (!res.ok) return { status: 'free' }
  return entitlementFor(res.plan, res.expires, record.email, today)
}

/** Entitlement for an already-verified plan/expiry (also used to preview a code before saving). */
export function entitlementFor(plan: Plan, expires: string | null, email: string, today: string): Entitlement {
  if (plan === 'lifetime' || !expires) return { status: 'lifetime', email }
  const daysLeft = dayNumber(expires) - dayNumber(today)
  if (daysLeft < -GRACE_DAYS) return { status: 'expired', email, expires }
  return {
    status: 'monthly',
    email,
    expires,
    daysLeft,
    remind: daysLeft <= REMIND_DAYS,
    inGrace: daysLeft < 0,
  }
}
