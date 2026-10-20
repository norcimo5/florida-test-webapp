/**
 * install.ts — "Instalar app" support for both phone platforms.
 *
 * Android (Chrome, Edge, Samsung Internet): the browser fires `beforeinstallprompt`; we keep it
 * and show our own "Instalar" button that calls `promptInstall()`.
 * iPhone/iPad (Safari): there is no install API. We detect iOS and show manual steps instead
 * (Compartir → "Agregar a inicio"), see ui/screens/InstallScreen.tsx.
 * Already installed (running standalone): nothing to show.
 */
import { useSyncExternalStore } from 'react'

/** Chrome's install-prompt event (not in TypeScript's DOM lib). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

/** Call once at startup (main.tsx) — must run before the browser fires the event. */
export function initInstallCapture(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // keep the mini-infobar from appearing; we show our own button
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

/** True on iPhone/iPad (including iPadOS that reports itself as a Mac). */
export function isIos(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

/** True when the app is running as an installed app (home-screen icon), not in a browser tab. */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** How the app can be installed right now. */
export type InstallMode = 'installed' | 'prompt' | 'ios' | 'manual'

function mode(): InstallMode {
  if (isStandalone()) return 'installed'
  if (deferred) return 'prompt'
  if (isIos()) return 'ios'
  return 'manual'
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** React hook: current install mode (updates when Chrome makes the prompt available). */
export function useInstallMode(): InstallMode {
  return useSyncExternalStore(subscribe, mode, mode)
}

/** Opens Chrome's install dialog. Returns true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  const ev = deferred
  deferred = null
  await ev.prompt()
  const choice = await ev.userChoice
  notify()
  return choice.outcome === 'accepted'
}
