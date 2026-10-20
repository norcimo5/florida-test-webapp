/**
 * unlockCode.ts — create and verify Premium unlock codes ("FLDMV-XXXXX-XXXXX-…").
 *
 * HOW IT WORKS (full guide: docs/UNLOCK-CODES.md)
 *   The owner runs `npm run code -- --email buyer@x.com --plan monthly` on his own computer. That
 *   command (tools/make-unlock-code.ts) signs a tiny payload with a PRIVATE Ed25519 key that lives
 *   outside the repo (~/keystores/fldmv-unlock-ed25519.key). The app only has the PUBLIC key
 *   (src/config/unlockPublicKey.ts), so it can check codes offline but can never create them.
 *
 * PAYLOAD (14 bytes, then a 64-byte Ed25519 signature over those bytes)
 *   [0]      format version (1)
 *   [1]      plan: 1 = lifetime, 2 = monthly
 *   [2..3]   issued day   (uint16, days since 1970-01-01)
 *   [4..5]   expires day  (uint16; 0 = never, used for lifetime) — last day of access, inclusive
 *   [6..13]  first 8 bytes of SHA-256(normalized buyer email) — ties the code to one email
 *
 * TEXT FORM: the 78 bytes in Crockford base32 (no I/L/O/U, case-insensitive), grouped in fives,
 * prefixed "FLDMV-". Parsing ignores spaces, dashes, case, and treats I/L as 1 and O as 0, so codes
 * survive copy-paste from email and manual typing.
 *
 * This file is shared by the browser app and the Node CLI, so it imports with explicit `.ts`
 * extensions and uses only erasable TypeScript (Node runs it with built-in type stripping).
 */
import { ed25519 } from '@noble/curves/ed25519.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { dayNumber, fromDayNumber } from '../domain/dates.ts'

/** Premium plan carried by a code. */
export type Plan = 'lifetime' | 'monthly'

/** Decoded, signature-checked contents of a code. */
export interface UnlockInfo {
  plan: Plan
  /** Day key the code was made, e.g. "2026-10-20". */
  issued: string
  /** Last day of access (inclusive), or null for lifetime. */
  expires: string | null
}

/** Why a code was rejected. The UI maps each reason to a Spanish message. */
export type RejectReason = 'format' | 'version' | 'signature' | 'email'

/** Result of `verifyUnlockCode`. */
export type VerifyResult = ({ ok: true } & UnlockInfo) | { ok: false; reason: RejectReason }

/** Inputs for `createUnlockCode`. */
export interface CreateCodeInput {
  email: string
  plan: Plan
  issued: string
  /** Required for monthly; must be null/undefined for lifetime. */
  expires?: string | null
}

const VERSION = 1
const PAYLOAD_LEN = 14
const SIG_LEN = 64
const PREFIX = 'FLDMV'
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ' // Crockford base32

/** Canonical email form used for the hash: trimmed and lower-cased. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Loose email shape check for form validation (not a full RFC parser). */
export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function emailHash(email: string): Uint8Array {
  return sha256(new TextEncoder().encode(normalizeEmail(email))).slice(0, 8)
}

function base32Encode(bytes: Uint8Array): string {
  let out = ''
  let buffer = 0
  let bits = 0
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(buffer >>> (bits - 5)) & 31]
      bits -= 5
    }
    buffer &= (1 << bits) - 1
  }
  if (bits > 0) out += ALPHABET[(buffer << (5 - bits)) & 31]
  return out
}

function base32Decode(text: string): Uint8Array | null {
  const bytes: number[] = []
  let buffer = 0
  let bits = 0
  for (const ch of text) {
    const v = ALPHABET.indexOf(ch)
    if (v < 0) return null
    buffer = (buffer << 5) | v
    bits += 5
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 255)
      bits -= 8
    }
    buffer &= (1 << bits) - 1
  }
  return Uint8Array.from(bytes)
}

/** Strips the prefix, separators and case; maps look-alike letters (I/L -> 1, O -> 0). */
function cleanCode(code: string): string {
  let s = code.toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (s.startsWith(PREFIX)) s = s.slice(PREFIX.length)
  return s.replace(/[IL]/g, '1').replace(/O/g, '0')
}

function formatCode(body: string): string {
  return [PREFIX, ...(body.match(/.{1,5}/g) ?? [])].join('-')
}

function writeU16(buf: Uint8Array, at: number, value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff) throw new Error(`Day out of range: ${value}`)
  buf[at] = value >> 8
  buf[at + 1] = value & 0xff
}

function readU16(buf: Uint8Array, at: number): number {
  return (buf[at] << 8) | buf[at + 1]
}

/**
 * Makes a signed unlock code. Used only by the owner's CLI — the private key must never be
 * shipped in the app.
 */
export function createUnlockCode(input: CreateCodeInput, secretKey: Uint8Array): string {
  if (input.plan === 'monthly' && !input.expires) throw new Error('Monthly codes need an expiry day')
  if (input.plan === 'lifetime' && input.expires) throw new Error('Lifetime codes must not expire')
  const payload = new Uint8Array(PAYLOAD_LEN)
  payload[0] = VERSION
  payload[1] = input.plan === 'lifetime' ? 1 : 2
  writeU16(payload, 2, dayNumber(input.issued))
  writeU16(payload, 4, input.expires ? dayNumber(input.expires) : 0)
  payload.set(emailHash(input.email), 6)
  const sig = ed25519.sign(payload, secretKey)
  const all = new Uint8Array(PAYLOAD_LEN + SIG_LEN)
  all.set(payload, 0)
  all.set(sig, PAYLOAD_LEN)
  return formatCode(base32Encode(all))
}

/**
 * Checks a code typed/pasted by the user against the email they entered.
 * Never throws: bad input returns `{ ok: false, reason }`. Does NOT check expiry against today —
 * that is billing/entitlement.ts's job, so a renewed or expired code is handled in one place.
 */
export function verifyUnlockCode(code: string, email: string, publicKey: Uint8Array): VerifyResult {
  const bytes = base32Decode(cleanCode(code))
  if (!bytes || bytes.length !== PAYLOAD_LEN + SIG_LEN) return { ok: false, reason: 'format' }
  const payload = bytes.slice(0, PAYLOAD_LEN)
  const sig = bytes.slice(PAYLOAD_LEN)
  if (payload[0] !== VERSION) return { ok: false, reason: 'version' }
  let valid = false
  try {
    valid = ed25519.verify(sig, payload, publicKey)
  } catch {
    valid = false
  }
  if (!valid) return { ok: false, reason: 'signature' }
  const hash = emailHash(email)
  for (let i = 0; i < 8; i++) {
    if (payload[6 + i] !== hash[i]) return { ok: false, reason: 'email' }
  }
  const planByte = payload[1]
  if (planByte !== 1 && planByte !== 2) return { ok: false, reason: 'format' }
  const expiresDay = readU16(payload, 4)
  return {
    ok: true,
    plan: planByte === 1 ? 'lifetime' : 'monthly',
    issued: fromDayNumber(readU16(payload, 2)),
    expires: expiresDay === 0 ? null : fromDayNumber(expiresDay),
  }
}

/** Lower-case hex of bytes (for printing/storing keys). */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Bytes from a hex string. Throws on malformed input. */
export function fromHex(hex: string): Uint8Array {
  const clean = hex.trim()
  if (!/^([0-9a-fA-F]{2})*$/.test(clean)) throw new Error('Invalid hex')
  return Uint8Array.from(clean.match(/.{2}/g) ?? [], (h) => parseInt(h, 16))
}

/** New random Ed25519 secret key (CLI `--init` only). */
export function generateSecretKey(): Uint8Array {
  return ed25519.utils.randomSecretKey()
}

/** Public key matching a secret key. */
export function publicKeyFor(secretKey: Uint8Array): Uint8Array {
  return ed25519.getPublicKey(secretKey)
}
