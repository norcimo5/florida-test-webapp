/**
 * offline-check.ts — proves the built app installs a service worker and works with NO network.
 *
 *   npm run build && npm run preview &     (serve dist/ on :4173)
 *   npm run offline-check
 *
 * Opens the app in headless Chrome, waits for the service worker to install, cuts the network,
 * reloads (now served by the service worker), and checks Inicio, a study screen and the privacy policy still load. Also prints the key
 * manifest fields. Exits non-zero on failure.
 */
import { chromium } from 'playwright-core'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: { url: { type: 'string', default: 'http://localhost:4173/florida-test-webapp/' } },
})
const base = values.url!

const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext({ viewport: { width: 412, height: 823 } })
const page = await ctx.newPage()
await page.addInitScript(() => {
  if (!localStorage.getItem('fldmv.state.v1')) {
    localStorage.setItem('fldmv.state.v1', JSON.stringify({ userName: 'Maria', installDismissed: true }))
  }
})
await page.goto(base)
await page.evaluate(() => navigator.serviceWorker.ready)
const manifest = await page.evaluate(async () => (await fetch('manifest.webmanifest')).json())

await ctx.setOffline(true)
await page.reload()
// A first visit isn't controlled by the service worker; every load after it is (that's this reload).
const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller)
const offlineHome = await page.textContent('h1')
await page.goto(`${base}#/study/REGLAS`)
await page.waitForTimeout(400)
const offlineStudy = await page.textContent('h1')
const privacy = await page.goto(`${base}privacy-policy.html`)
const privacyOk = privacy?.ok() && (await page.textContent('h1'))?.includes('Examen de Manejo Florida')
await browser.close()

const result = {
  controlled,
  offlineHome,
  offlineStudy,
  privacyOk,
  manifest: { name: manifest.name, display: manifest.display, start_url: manifest.start_url, icons: manifest.icons.length },
}
console.log(JSON.stringify(result, null, 2))
const ok = controlled && offlineHome === '¡Hola, Maria!' && offlineStudy === 'Estudiar' && privacyOk
console.log(ok ? '\n✓ Offline check passed' : '\n✗ Offline check FAILED')
process.exit(ok ? 0 : 1)
