/**
 * make-unlock-code.ts — the OWNER's command for giving someone Premium. Runs on your computer only.
 *
 *   npm run code -- --email buyer@example.com --plan lifetime
 *   npm run code -- --email buyer@example.com --plan monthly            (30 days, auto-extends)
 *   npm run code -- --email buyer@example.com --plan monthly --days 60
 *   npm run code -- --init        (one time: create the signing key; refuses to overwrite)
 *   npm run code -- --list        (show issued codes and who needs a monthly renewal)
 *
 * It prints the code plus a ready-to-send Spanish email, and appends a line to
 * tools/issued-codes.csv (git-ignored; your private sales log).
 *
 * Monthly renewals stack: if the buyer's last monthly code (in the log) is still running,
 * the new 30 days start the day after it ends, so paying early never loses days.
 *
 * The private key lives OUTSIDE the repo: ~/keystores/fldmv-unlock-ed25519.key (override with
 * FLDMV_UNLOCK_KEY=/path). BACK IT UP. If it is lost you can't make new codes for the current app;
 * if it leaks, make a new one (docs/UNLOCK-CODES.md →
 * "If the private key is lost" / "If the private key leaks").
 *
 * Runs with Node's built-in TypeScript support (Node 23.6+), no build step.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, chmodSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import {
  createUnlockCode,
  fromHex,
  generateSecretKey,
  looksLikeEmail,
  normalizeEmail,
  publicKeyFor,
  toHex,
  verifyUnlockCode,
  type Plan,
} from '../src/billing/unlockCode.ts'
import { addDays, dayKey, dayNumber, formatDayEs } from '../src/domain/dates.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const KEY_PATH = process.env.FLDMV_UNLOCK_KEY ?? join(homedir(), 'keystores', 'fldmv-unlock-ed25519.key')
const LOG_PATH = join(HERE, 'issued-codes.csv')
const PUBLIC_KEY_FILE = join(HERE, '..', 'src', 'config', 'unlockPublicKey.ts')
const APP_URL = 'https://norcimo5.github.io/florida-test-webapp/'
const LOG_HEADER = 'issued,email,plan,expires,code\n'

interface LogRow {
  issued: string
  email: string
  plan: Plan
  expires: string
  code: string
}

function fail(msg: string): never {
  console.error(`\n✗ ${msg}\n`)
  process.exit(1)
}

function readLog(): LogRow[] {
  if (!existsSync(LOG_PATH)) return []
  return readFileSync(LOG_PATH, 'utf8')
    .split('\n')
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const [issued, email, plan, expires, code] = line.split(',')
      return { issued, email, plan: plan as Plan, expires, code }
    })
}

function loadSecretKey(): Uint8Array {
  if (!existsSync(KEY_PATH)) fail(`No signing key at ${KEY_PATH}. Run: npm run code -- --init`)
  return fromHex(readFileSync(KEY_PATH, 'utf8'))
}

function init(): void {
  if (existsSync(KEY_PATH)) fail(`A key already exists at ${KEY_PATH}. Refusing to overwrite it.`)
  const sk = generateSecretKey()
  mkdirSync(dirname(KEY_PATH), { recursive: true })
  writeFileSync(KEY_PATH, toHex(sk) + '\n', { mode: 0o600 })
  chmodSync(KEY_PATH, 0o600)
  const pk = toHex(publicKeyFor(sk))
  const src = readFileSync(PUBLIC_KEY_FILE, 'utf8').replace(/'[0-9a-f]{64}'/, `'${pk}'`)
  writeFileSync(PUBLIC_KEY_FILE, src)
  console.log(`\n✓ New signing key saved to ${KEY_PATH} (back it up!)`)
  console.log(`✓ Public key written to src/config/unlockPublicKey.ts: ${pk}`)
  console.log('  Rebuild and deploy the app (npm run deploy) so it accepts codes from this key.\n')
}

function list(): void {
  const rows = readLog()
  if (rows.length === 0) return void console.log('\nNo codes issued yet.\n')
  const today = dayKey()
  console.log('\nissued      plan      expires     email')
  for (const r of rows) console.log(`${r.issued}  ${r.plan.padEnd(8)}  ${(r.expires || '—').padEnd(10)}  ${r.email}`)
  // Latest monthly expiry per email -> who is due soon.
  const latest = new Map<string, string>()
  for (const r of rows) {
    if (r.plan !== 'monthly') continue
    const prev = latest.get(r.email)
    if (!prev || r.expires > prev) latest.set(r.email, r.expires)
  }
  const due = [...latest].filter(([, exp]) => dayNumber(exp) - dayNumber(today) <= 5)
  if (due.length) {
    console.log('\nMonthly buyers ending within 5 days (or already ended):')
    for (const [email, exp] of due) console.log(`  ${email}  ends ${exp}`)
  }
  console.log('')
}

function make(emailArg: string, plan: Plan, days: number): void {
  const email = normalizeEmail(emailArg)
  if (!looksLikeEmail(email)) fail(`"${emailArg}" doesn't look like an email address.`)
  const sk = loadSecretKey()
  const today = dayKey()

  let expires: string | null = null
  if (plan === 'monthly') {
    // Stack on top of a still-running monthly code for the same email.
    const running = readLog()
      .filter((r) => r.email === email && r.plan === 'monthly' && r.expires >= today)
      .map((r) => r.expires)
      .sort()
      .pop()
    const start = running ? addDays(running, 1) : today
    expires = addDays(start, days - 1)
  }

  const code = createUnlockCode({ email, plan, issued: today, expires }, sk)
  // Self-check with the public key derived from the same secret key before handing it out.
  const check = verifyUnlockCode(code, email, publicKeyFor(sk))
  if (!check.ok) fail(`Internal error: the new code did not verify (${check.reason}).`)
  const appKey = /'([0-9a-f]{64})'/.exec(readFileSync(PUBLIC_KEY_FILE, 'utf8'))?.[1]
  if (appKey !== toHex(publicKeyFor(sk))) {
    console.warn('\n⚠ WARNING: src/config/unlockPublicKey.ts does not match your signing key.')
    console.warn('  The deployed app will REJECT this code until the public key matches. See docs/UNLOCK-CODES.md.')
  }

  if (!existsSync(LOG_PATH)) writeFileSync(LOG_PATH, LOG_HEADER)
  appendFileSync(LOG_PATH, `${today},${email},${plan},${expires ?? ''},${code}\n`)

  const planEs = plan === 'lifetime' ? 'Acceso de por vida' : 'Plan mensual'
  const untilEs = expires ? `\nTu acceso es válido hasta el ${formatDayEs(expires)}.` : ''
  console.log(`\n✓ ${plan.toUpperCase()} code for ${email}${expires ? ` (valid through ${expires})` : ''}`)
  console.log('  Logged in tools/issued-codes.csv\n')
  console.log('──────── Copy everything between the lines into your email ────────')
  console.log(`Asunto: Tu código de activación Premium – Examen de Manejo Florida

¡Hola!

Gracias por tu pago. Aquí está tu código de activación (${planEs}):

${code}

Cómo activarlo:
1. Abre la app: ${APP_URL}
2. Ve a Ajustes → Activar Premium.
3. Escribe este correo: ${email}
4. Copia y pega el código completo y toca ACTIVAR.
${untilEs}
Si tienes algún problema, responde a este correo.

¡Mucho éxito en tu examen!
Bit Ensemble Solutions`)
  console.log('────────────────────────────────────────────────────────────────────\n')
}

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    plan: { type: 'string' },
    days: { type: 'string', default: '30' },
    init: { type: 'boolean', default: false },
    list: { type: 'boolean', default: false },
  },
})

if (values.init) init()
else if (values.list) list()
else {
  if (!values.email) fail('Missing --email. Example: npm run code -- --email buyer@example.com --plan lifetime')
  if (values.plan !== 'lifetime' && values.plan !== 'monthly') fail('--plan must be "lifetime" or "monthly".')
  const days = Number(values.days)
  if (!Number.isInteger(days) || days < 1 || days > 400) fail('--days must be a whole number from 1 to 400.')
  make(values.email, values.plan, days)
}
