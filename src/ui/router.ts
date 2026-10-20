/**
 * router.ts — tiny hash router (no library). Routes live after '#', e.g. `#/study/REGLAS`.
 *
 * Why hash routing: GitHub Pages can't rewrite deep links to index.html, and the service worker
 * caches a single page. Hash URLs always load index.html, work offline, and keep the browser /
 * Android back button working.
 *
 * Route table (mirrors the Android NavHost in ui/nav/AppNav.kt):
 *   /home  /topics  /exams  /profile  /settings      — bottom-nav tabs
 *   /study/:topic                                      — StudyScreen (topic = SENALES|REGLAS|SEGURIDAD|ESPECIAL)
 *   /exam/:count                                       — ExamScreen (5 = Daily Quiz, 50 = Full Mock)
 *   /results/:correct/:total                           — ResultsScreen
 *   /paywall  /activate  /install                      — Premium + install helpers
 */
import { useSyncExternalStore } from 'react'

/** Bottom-navigation tab routes, in display order. */
export const TAB_ROUTES = ['/home', '/topics', '/exams', '/profile', '/settings'] as const

/** A parsed route: `path` like '/study/REGLAS' and its `segments` ['study', 'REGLAS']. */
export interface Route {
  path: string
  segments: string[]
}

function currentPath(): string {
  const raw = window.location.hash.replace(/^#/, '')
  return raw.startsWith('/') && raw.length > 1 ? raw : '/home'
}

let cachedPath = ''
let cachedRoute: Route = { path: '/home', segments: ['home'] }

function getRoute(): Route {
  const path = currentPath()
  if (path !== cachedPath) {
    cachedPath = path
    cachedRoute = { path, segments: path.split('/').filter(Boolean).map(decodeURIComponent) }
  }
  return cachedRoute
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

/** React hook: the current route; re-renders on navigation. */
export function useRoute(): Route {
  return useSyncExternalStore(subscribe, getRoute, getRoute)
}

/**
 * Go to `path`. `replace: true` swaps the current history entry (like Android's popUpTo), so the
 * back button skips it — used for exam → results and for tab switches.
 */
export function navigate(path: string, opts: { replace?: boolean } = {}): void {
  if (path === currentPath()) return
  if (opts.replace) {
    // Keep the entry's state so the 'root' marker (see markRoot) survives a replace.
    window.history.replaceState(window.history.state, '', `#${path}`)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = path
  }
}

/**
 * Marks the first history entry of this app session. Called once at startup (main.tsx) so
 * `goBack` never navigates out of the app — on the root entry it goes to Inicio instead.
 */
export function markRoot(): void {
  window.history.replaceState('root', '', `#${currentPath()}`)
}

/** Back one screen; on the app's first entry (e.g. opened at #/topics) go to Inicio instead. */
export function goBack(): void {
  if (window.history.state !== 'root') window.history.back()
  else navigate('/home', { replace: true })
}

/**
 * Walks back through history until Inicio (or the app's first entry, which becomes Inicio).
 * Used by "Volver al Inicio" and the Inicio tab, so Back never re-opens finished screens.
 */
export function goHome(): void {
  if (currentPath() === '/home') return
  if (window.history.state === 'root') {
    navigate('/home', { replace: true })
    return
  }
  window.addEventListener('popstate', () => goHome(), { once: true })
  window.history.back()
}

/**
 * Tab switch with Android back-stack behaviour: from Inicio, a tab is pushed (back returns to
 * Inicio); between other tabs it replaces, so Back always lands on Inicio, never cycles tabs.
 */
export function navigateTab(path: (typeof TAB_ROUTES)[number]): void {
  const fromHome = currentPath() === '/home'
  if (path === '/home') {
    goHome()
    return
  }
  navigate(path, { replace: !fromHome })
}
