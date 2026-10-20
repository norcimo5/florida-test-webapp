/**
 * screenshots.ts — takes phone-size screenshots of every screen, for visual checks against the
 * Android reference screenshots (../florida-test-android-app/docs/play/screenshots/01-08*.png).
 *
 *   npm run build && npx vite preview --port 4173 &      (serve the built app)
 *   npm run shots                                          (→ /dev/shm/fldmv-shots/*.png)
 *   npm run shots -- --url http://localhost:5173/florida-test-webapp/ --out ./shots
 *
 * Uses the system Google Chrome via playwright-core (no browser download). The viewport matches the
 * Android screenshots: 412×823 CSS px at 2.625× = 1081×2160 px. Each scenario seeds localStorage
 * (store/appStore.ts shape) before the page loads. Premium scenarios need the signing key
 * (~/keystores/fldmv-unlock-ed25519.key); they are skipped without it.
 */
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { createUnlockCode, fromHex } from '../src/billing/unlockCode.ts'
import { addDays, dayKey } from '../src/domain/dates.ts'

const { values } = parseArgs({
  options: {
    url: { type: 'string', default: 'http://localhost:4173/florida-test-webapp/' },
    out: { type: 'string', default: '/dev/shm/fldmv-shots' },
    only: { type: 'string' },
  },
})

const KEY_PATH = process.env.FLDMV_UNLOCK_KEY ?? join(homedir(), 'keystores', 'fldmv-unlock-ed25519.key')
const today = dayKey()
const sk = existsSync(KEY_PATH) ? fromHex(readFileSync(KEY_PATH, 'utf8')) : null
const email = 'maria@example.com'
const lifetime = sk ? { email, code: createUnlockCode({ email, plan: 'lifetime', issued: today }, sk) } : null
const monthlySoon = sk
  ? { email, code: createUnlockCode({ email, plan: 'monthly', issued: addDays(today, -28), expires: addDays(today, 2) }, sk) }
  : null

const base = { userName: 'Maria', answers: {}, mocks: [], freeDay: null, freeCount: 0, quizDay: null, unlock: null, installDismissed: true }
const someAnswers = { s1: true }
const mocks = [62, 70, 76, 84, 88].map((p, i) => ({ at: 1_760_000_000_000 + i * 86_400_000, correct: Math.round(p / 2), total: 50 }))

interface Shot {
  name: string
  hash: string
  state: Record<string, unknown> | null
  /** Optional interaction after load (e.g. answer a question). */
  act?: (page: import('playwright-core').Page) => Promise<void>
  needsKey?: boolean
}

const SHOTS: Shot[] = [
  { name: '01-onboarding', hash: '/home', state: null },
  { name: '02-inicio', hash: '/home', state: base },
  { name: '03-temas', hash: '/topics', state: { ...base, answers: someAnswers } },
  { name: '04-estudiar', hash: '/study/SENALES', state: base },
  {
    name: '05-porque',
    hash: '/study/SENALES',
    state: base,
    act: async (p) => {
      await p.locator('.choice').first().click()
      await p.waitForTimeout(300)
    },
  },
  { name: '06-paywall', hash: '/paywall', state: base },
  { name: '07-examen', hash: '/exam/50', state: { ...base, unlock: lifetime }, needsKey: true },
  { name: '08-perfil', hash: '/profile', state: { ...base, mocks, unlock: lifetime }, needsKey: true },
  { name: '09-ajustes', hash: '/settings', state: base },
  { name: '10-activar', hash: '/activate', state: base },
  { name: '11-instalar', hash: '/install', state: base },
  { name: '12-inicio-install-card', hash: '/home', state: { ...base, installDismissed: false } },
  { name: '13-inicio-renovar', hash: '/home', state: { ...base, unlock: monthlySoon }, needsKey: true },
  { name: '14-resultados', hash: '/results/42/50', state: base },
  { name: '15-examenes', hash: '/exams', state: base },
]

mkdirSync(values.out!, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({
  viewport: { width: 412, height: 823 },
  deviceScaleFactor: 2.625,
  isMobile: true,
  hasTouch: true,
  locale: 'es-US',
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
})

for (const shot of SHOTS) {
  if (values.only && !shot.name.includes(values.only)) continue
  if (shot.needsKey && !sk) {
    console.log(`skip ${shot.name} (no signing key)`)
    continue
  }
  const page = await context.newPage()
  await page.addInitScript((state) => {
    localStorage.clear()
    if (state) localStorage.setItem('fldmv.state.v1', JSON.stringify(state))
  }, shot.state)
  await page.goto(`${values.url}#${shot.hash}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1100) // let enter/meter/chart animations finish
  if (shot.act) await shot.act(page)
  const file = join(values.out!, `${shot.name}.png`)
  await page.screenshot({ path: file })
  console.log(`✓ ${file}`)
  await page.close()
}
await browser.close()
