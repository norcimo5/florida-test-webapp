/**
 * Unlock-code + entitlement tests: valid codes unlock, tampered/foreign codes are rejected,
 * monthly codes remind, enter grace, then re-lock.
 */
import { describe, expect, it } from 'vitest'
import {
  createUnlockCode,
  generateSecretKey,
  publicKeyFor,
  verifyUnlockCode,
} from '../../src/billing/unlockCode'
import { computeEntitlement, GRACE_DAYS, isPremium } from '../../src/billing/entitlement'
import { addDays } from '../../src/domain/dates'

const sk = generateSecretKey()
const pk = publicKeyFor(sk)
const email = 'Buyer@Example.com'

describe('unlock codes', () => {
  it('a lifetime code verifies for the same email (case/space-insensitive)', () => {
    const code = createUnlockCode({ email, plan: 'lifetime', issued: '2026-10-20' }, sk)
    expect(code.startsWith('FLDMV-')).toBe(true)
    const res = verifyUnlockCode(code, '  buyer@example.COM ', pk)
    expect(res).toEqual({ ok: true, plan: 'lifetime', issued: '2026-10-20', expires: null })
  })

  it('survives lower-case, missing dashes, spaces and look-alike letters', () => {
    const code = createUnlockCode({ email, plan: 'lifetime', issued: '2026-10-20' }, sk)
    const mangled = ' ' + code.toLowerCase().replace(/-/g, ' ').replace(/1/g, 'l').replace(/0/g, 'o') + '\n'
    expect(verifyUnlockCode(mangled, email, pk).ok).toBe(true)
  })

  it('rejects a code used with a different email', () => {
    const code = createUnlockCode({ email, plan: 'lifetime', issued: '2026-10-20' }, sk)
    expect(verifyUnlockCode(code, 'someone@else.com', pk)).toEqual({ ok: false, reason: 'email' })
  })

  it('rejects a tampered code (one character changed)', () => {
    const code = createUnlockCode({ email, plan: 'monthly', issued: '2026-10-20', expires: '2026-11-18' }, sk)
    // Flip a character inside the payload (right after the prefix group).
    const i = 'FLDMV-'.length + 2
    const flipped = code.slice(0, i) + (code[i] === 'A' ? 'B' : 'A') + code.slice(i + 1)
    expect(verifyUnlockCode(flipped, email, pk)).toEqual({ ok: false, reason: 'signature' })
  })

  it('rejects codes signed with a different key (forgery)', () => {
    const otherSk = generateSecretKey()
    const code = createUnlockCode({ email, plan: 'lifetime', issued: '2026-10-20' }, otherSk)
    expect(verifyUnlockCode(code, email, pk)).toEqual({ ok: false, reason: 'signature' })
  })

  it('rejects garbage and truncated input as a format error', () => {
    expect(verifyUnlockCode('hello', email, pk)).toEqual({ ok: false, reason: 'format' })
    const code = createUnlockCode({ email, plan: 'lifetime', issued: '2026-10-20' }, sk)
    expect(verifyUnlockCode(code.slice(0, -6), email, pk)).toEqual({ ok: false, reason: 'format' })
    expect(verifyUnlockCode('FLDMV-UUUUU', email, pk)).toEqual({ ok: false, reason: 'format' })
  })

  it('refuses to create inconsistent codes', () => {
    expect(() => createUnlockCode({ email, plan: 'monthly', issued: '2026-10-20' }, sk)).toThrow()
    expect(() =>
      createUnlockCode({ email, plan: 'lifetime', issued: '2026-10-20', expires: '2026-11-01' }, sk),
    ).toThrow()
  })
})

describe('entitlement', () => {
  const expires = '2026-11-18'
  const monthly = { email, code: createUnlockCode({ email, plan: 'monthly', issued: '2026-10-20', expires }, sk) }

  it('no record = free', () => {
    expect(computeEntitlement(null, '2026-10-20', pk)).toEqual({ status: 'free' })
  })

  it('lifetime never expires', () => {
    const rec = { email, code: createUnlockCode({ email, plan: 'lifetime', issued: '2026-10-20' }, sk) }
    const e = computeEntitlement(rec, '2040-01-01', pk)
    expect(e.status).toBe('lifetime')
    expect(isPremium(e)).toBe(true)
  })

  it('monthly: active, no reminder well before expiry', () => {
    const e = computeEntitlement(monthly, '2026-10-25', pk)
    expect(e).toMatchObject({ status: 'monthly', remind: false, inGrace: false })
    expect(isPremium(e)).toBe(true)
  })

  it('monthly: reminds in the last 3 days and on the expiry day', () => {
    expect(computeEntitlement(monthly, addDays(expires, -3), pk)).toMatchObject({ remind: true, daysLeft: 3 })
    expect(computeEntitlement(monthly, expires, pk)).toMatchObject({ status: 'monthly', daysLeft: 0 })
  })

  it('monthly: grace period keeps access, then re-locks', () => {
    const grace = computeEntitlement(monthly, addDays(expires, GRACE_DAYS), pk)
    expect(grace).toMatchObject({ status: 'monthly', inGrace: true })
    expect(isPremium(grace)).toBe(true)
    const after = computeEntitlement(monthly, addDays(expires, GRACE_DAYS + 1), pk)
    expect(after).toEqual({ status: 'expired', email, expires })
    expect(isPremium(after)).toBe(false)
  })

  it('a stored code that no longer verifies (edited or old key) counts as free', () => {
    expect(computeEntitlement({ email, code: 'FLDMV-ABCDE' }, '2026-10-20', pk)).toEqual({ status: 'free' })
    expect(computeEntitlement({ email: 'x@y.com', code: monthly.code }, '2026-10-20', pk)).toEqual({
      status: 'free',
    })
  })
})
