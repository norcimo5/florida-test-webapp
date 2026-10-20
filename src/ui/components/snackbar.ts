/**
 * snackbar.ts — a tiny global message queue for the Snackbar (one message at a time, ~3.5 s).
 * Call showSnackbar('…') from anywhere; <Snackbar /> (overlays.tsx, mounted once in App) shows it.
 */
import { useSyncExternalStore } from 'react'

let message: string | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

/** Shows a short Spanish message at the bottom for ~3.5 seconds. */
export function showSnackbar(text: string): void {
  message = text
  clearTimeout(timer)
  timer = setTimeout(() => {
    message = null
    listeners.forEach((l) => l())
  }, 3500)
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** React hook: the message currently shown, or null. */
export function useSnackbarMessage(): string | null {
  return useSyncExternalStore(subscribe, () => message, () => message)
}
