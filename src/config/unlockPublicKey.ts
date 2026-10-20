/**
 * unlockPublicKey.ts — the PUBLIC half of the unlock-code signing key.
 *
 * Safe to publish: it can only CHECK codes, not create them. The matching private key lives on
 * the owner's computer (~/keystores/fldmv-unlock-ed25519.key) and must never enter this repo.
 * `npm run code -- --init` rewrites the hex below; changing it invalidates every code issued with
 * the old key (see docs/UNLOCK-CODES.md → "If the private key is lost" / "…leaks").
 */
import { fromHex } from '../billing/unlockCode'

/** Hex form (64 hex chars = 32 bytes). Rewritten in place by `npm run code -- --init`. */
export const UNLOCK_PUBLIC_KEY_HEX = '9d5385536b94958e2c473c1390c9bde4ac6eb444f9b083b73d8d0b6c6aabb73c'

/** Bytes form used by billing/entitlement.ts. */
export const UNLOCK_PUBLIC_KEY: Uint8Array = fromHex(UNLOCK_PUBLIC_KEY_HEX)
